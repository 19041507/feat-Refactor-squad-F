import test from 'node:test';
import assert from 'node:assert/strict';
import { createAiService } from '../src/backend/services/ai.service.js';

const config = { apiKey: 'test-key-not-real', model: 'test-model', timeoutMs: 100 };
const messages = [{ role: 'user', content: 'Como organizar meu projeto?' }];
const result = (content, finishReason = 'STOP') => ({
  candidates: [{ content: { role: 'model', parts: content }, finishReason }],
});

test('Gemini recebe modelo, contexto e chave apenas no servidor', async () => {
  let request;
  const service = createAiService(config, async (url, options) => {
    request = { url, ...options, body: JSON.parse(options.body) };
    return Response.json(result([{ text: 'Separe código e testes.' }]));
  });
  const reply = await service(messages);
  assert.equal(reply, 'Separe código e testes.');
  assert.equal(
    request.url,
    'https://generativelanguage.googleapis.com/v1beta/models/test-model:generateContent',
  );
  assert.equal(request.headers['x-goog-api-key'], 'test-key-not-real');
  assert.equal(request.body.generationConfig.thinkingConfig.thinkingLevel, 'medium');
  assert.deepEqual(request.body.contents, [
    { role: 'user', parts: [{ text: messages[0].content }] },
  ]);
  assert.match(request.body.systemInstruction.parts[0].text, /Fê/);
  assert.ok(request.signal instanceof AbortSignal);
});

test('extrai recusa de forma legível e rejeita saída vazia ou incompleta', async () => {
  const service = createAiService(config, async () =>
    Response.json({ promptFeedback: { blockReason: 'SAFETY' } }),
  );
  assert.match(await service(messages), /reformular/);
  for (const payload of [{ output: [] }, { status: 'incomplete', output: [] }]) {
    await assert.rejects(
      createAiService(config, async () => Response.json(payload))(messages),
      (error) => error.status === 502,
    );
  }
});

test('sem chave não realiza chamada externa', async () => {
  let called = false;
  await assert.rejects(
    createAiService({ ...config, apiKey: '' }, async () => {
      called = true;
    })(messages),
    (error) => error.status === 503,
  );
  assert.equal(called, false);
});

for (const [upstream, expected] of [
  [401, 503],
  [403, 503],
  [429, 429],
  [500, 502],
]) {
  test(`erro ${upstream} do provedor vira ${expected} sem expor detalhes`, async () => {
    const service = createAiService(config, async () =>
      Response.json(
        { error: { message: 'private provider detail test-key-not-real' } },
        { status: upstream },
      ),
    );
    await assert.rejects(service(messages), (error) => {
      assert.equal(error.status, expected);
      assert.doesNotMatch(error.message, /private|test-key/);
      return true;
    });
  });
}

test('timeout e falha de rede geram erros recuperáveis', async () => {
  for (const [name, status] of [
    ['TimeoutError', 504],
    ['TypeError', 502],
  ]) {
    const service = createAiService(config, async () => {
      throw Object.assign(new Error('network'), { name });
    });
    await assert.rejects(service(messages), (error) => error.status === status);
  }
});

test('falha transitória troca uma vez de modelo e entrega resposta', async () => {
  const calls = [];
  const service = createAiService({ ...config, fastModel: 'fast' }, async (url, options) => {
    calls.push({ ...JSON.parse(options.body), model: url.split('/models/')[1].split(':')[0] });
    return calls.length === 1
      ? Response.json({ error: { code: 'server_error' } }, { status: 503 })
      : Response.json(result([{ text: 'Bora organizar isso!' }]));
  });
  assert.equal(await service([{ role: 'user', content: 'Oi' }]), 'Bora organizar isso!');
  assert.deepEqual(
    calls.map((call) => call.model),
    ['fast', 'test-model'],
  );
  assert.ok(calls.every((call) => call.generationConfig.maxOutputTokens === 160));
});

test('chave inválida e cota esgotada não gastam tentativa em outro modelo', async () => {
  for (const [status, code] of [
    [401, 'invalid_api_key'],
    [403, 'PERMISSION_DENIED'],
    [400, 'invalid_request_error'],
  ]) {
    let calls = 0;
    const service = createAiService({ ...config, fastModel: 'fast' }, async () => {
      calls++;
      return Response.json({ error: { code } }, { status });
    });
    await assert.rejects(service(messages));
    assert.equal(calls, 1);
  }
});

test('modelo indisponível e rate limit temporário permitem alternativa; falhas param em duas tentativas', async () => {
  for (const code of [404, 429, 500]) {
    let count = 0;
    const service = createAiService({ ...config, fastModel: 'fast' }, async () => {
      count++;
      return Response.json({ error: { code: 'temporary' } }, { status: code });
    });
    await assert.rejects(service(messages));
    assert.equal(count, 2);
  }
});

test('orçamento aumenta só com pedido detalhado e contexto enviado é limitado', async () => {
  const sent = [];
  const service = createAiService(config, async (_, options) => {
    sent.push(JSON.parse(options.body));
    return Response.json(result([{ text: 'Tudo certo.' }]));
  });
  await service(messages);
  await service(messages, { detail: 'detailed' });
  assert.equal(sent[0].generationConfig.maxOutputTokens, 360);
  assert.equal(sent[1].generationConfig.maxOutputTokens, 800);
});

test('resposta parcial útil não dispara nova cobrança e informa limite', async () => {
  let calls = 0;
  const service = createAiService({ ...config, fastModel: 'fast' }, async () => {
    calls++;
    return Response.json({
      ...result([{ text: 'Comece por src/.' }]),
      candidates: [
        {
          content: { role: 'model', parts: [{ text: 'Comece por src/.' }] },
          finishReason: 'MAX_TOKENS',
        },
      ],
    });
  });
  const reply = await service(messages);
  assert.match(reply, /Comece por src/);
  assert.match(reply, /limite/i);
  assert.equal(calls, 1);
});

test('timeout aborta tentativa travada e ainda permite alternativa dentro do prazo total', async () => {
  let calls = 0;
  const service = createAiService(
    { ...config, timeoutMs: 200, fastModel: 'fast' },
    async (_, options) => {
      calls++;
      if (calls === 2) return Response.json(result([{ text: 'Resposta alternativa.' }]));
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('sinal não abortou')), 1000);
        options.signal.addEventListener(
          'abort',
          () => {
            clearTimeout(timer);
            reject(options.signal.reason);
          },
          { once: true },
        );
      });
    },
  );
  assert.equal(await service(messages), 'Resposta alternativa.');
  assert.equal(calls, 2);
});

test('cota diária esgotada não tenta outro modelo', async () => {
  let calls = 0;
  const service = createAiService({ ...config, fastModel: 'fast' }, async () => {
    calls++;
    return Response.json(
      {
        error: {
          status: 'RESOURCE_EXHAUSTED',
          details: [
            {
              '@type': 'type.googleapis.com/google.rpc.QuotaFailure',
              violations: [{ quotaId: 'GenerateRequestsPerDayPerProjectPerModel-FreeTier' }],
            },
          ],
        },
      },
      { status: 429 },
    );
  });
  await assert.rejects(
    service(messages),
    (error) => error.status === 429 && /cota/.test(error.message),
  );
  assert.equal(calls, 1);
});

test('bloqueio de segurança não tenta contornar recusa com outro modelo', async () => {
  let calls = 0;
  const service = createAiService({ ...config, fastModel: 'fast' }, async () => {
    calls++;
    return Response.json(result([{ text: 'conteúdo bloqueado' }], 'SAFETY'));
  });
  assert.match(await service(messages), /reformular/);
  assert.equal(calls, 1);
});
test('ignora pensamentos e une partes de texto', async () => {
  const service = createAiService(config, async () =>
    Response.json(
      result([{ text: 'interno', thought: true }, { text: 'Olá, ' }, { text: 'Daniel!' }]),
    ),
  );
  assert.equal(await service(messages), 'Olá, Daniel!');
});
test('RetryInfo que ultrapassa prazo impede nova tentativa', async () => {
  let calls = 0;
  const service = createAiService({ ...config, fastModel: 'fast' }, async () => {
    calls++;
    return Response.json(
      {
        error: {
          details: [{ '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '60s' }],
        },
      },
      { status: 429 },
    );
  });
  await assert.rejects(service(messages), (error) => error.status === 429);
  assert.equal(calls, 1);
});

test('aguarda RetryInfo curto antes de usar alternativa', async () => {
  let calls = 0;
  let firstCall;
  const service = createAiService({ ...config, timeoutMs: 1000, fastModel: 'fast' }, async () => {
    calls++;
    if (calls === 1) {
      firstCall = performance.now();
      return Response.json(
        {
          error: {
            details: [{ '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '0.03s' }],
          },
        },
        { status: 429 },
      );
    }
    assert.ok(performance.now() - firstCall >= 25);
    return Response.json(result([{ text: 'Tudo certo.' }]));
  });
  assert.equal(await service(messages), 'Tudo certo.');
  assert.equal(calls, 2);
});
for (const kind of ['seconds', 'date']) {
  test('respeita Retry-After em formato ' + kind, async () => {
    let calls = 0;
    const service = createAiService({ ...config, fastModel: 'fast' }, async () => {
      calls++;
      return Response.json(
        { error: {} },
        {
          status: 429,
          headers: {
            'Retry-After': kind === 'seconds' ? '60' : new Date(Date.now() + 60000).toUTCString(),
          },
        },
      );
    });
    await assert.rejects(service(messages), (error) => error.status === 429);
    assert.equal(calls, 1);
  });
}

test('Flash-Lite usa raciocínio mínimo sem parâmetros removidos', async () => {
  const service = createAiService(
    { ...config, model: 'gemini-3.5-flash-lite' },
    async (_, options) => {
      const body = JSON.parse(options.body);
      assert.deepEqual(body.generationConfig.thinkingConfig, { thinkingLevel: 'minimal' });
      assert.equal('candidateCount' in body.generationConfig, false);
      assert.equal('temperature' in body.generationConfig, false);
      return Response.json(result([{ text: 'Oi!' }]));
    },
  );
  assert.equal(await service(messages), 'Oi!');
});

test('Flash reserva tokens para raciocínio sem reduzir espaço da resposta', async () => {
  const service = createAiService({ ...config, model: 'gemini-3.6-flash' }, async (_, options) => {
    const body = JSON.parse(options.body);
    assert.equal(body.generationConfig.maxOutputTokens, 2408);
    return Response.json(result([{ text: 'Separe os arquivos por responsabilidade.' }]));
  });
  await service(messages);
});
