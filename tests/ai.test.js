import test from 'node:test';
import assert from 'node:assert/strict';
import { createAiService } from '../src/backend/services/ai.service.js';

const config = { apiKey: 'test-key-not-real', model: 'test-model', timeoutMs: 100 };
const messages = [{ role: 'user', content: 'Como organizar meu projeto?' }];
const result = (content) => ({
  status: 'completed',
  output: [
    { type: 'reasoning', summary: [] },
    { type: 'message', role: 'assistant', content },
  ],
});

test('Responses API recebe modelo, contexto e chave apenas no servidor', async () => {
  let request;
  const service = createAiService(config, async (url, options) => {
    request = { url, ...options, body: JSON.parse(options.body) };
    return Response.json(result([{ type: 'output_text', text: 'Separe código e testes.' }]));
  });
  const reply = await service(messages);
  assert.equal(reply, 'Separe código e testes.');
  assert.equal(request.url, 'https://api.openai.com/v1/responses');
  assert.equal(request.headers.Authorization, 'Bearer test-key-not-real');
  assert.equal(request.body.model, 'test-model');
  assert.deepEqual(request.body.input, messages);
  assert.equal(request.body.store, false);
  assert.ok(request.signal instanceof AbortSignal);
});

test('extrai recusa de forma legível e rejeita saída vazia ou incompleta', async () => {
  const service = createAiService(config, async () =>
    Response.json(result([{ type: 'refusal', refusal: 'Não posso ajudar com isso.' }])),
  );
  assert.equal(await service(messages), 'Não posso ajudar com isso.');
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
  const service = createAiService({ ...config, fastModel: 'fast' }, async (_, options) => {
    calls.push(JSON.parse(options.body));
    return calls.length === 1
      ? Response.json({ error: { code: 'server_error' } }, { status: 503 })
      : Response.json(result([{ type: 'output_text', text: 'Bora organizar isso!' }]));
  });
  assert.equal(await service([{ role: 'user', content: 'Oi' }]), 'Bora organizar isso!');
  assert.deepEqual(
    calls.map((call) => call.model),
    ['fast', 'test-model'],
  );
  assert.ok(calls.every((call) => call.max_output_tokens === 160));
});

test('chave inválida e cota esgotada não gastam tentativa em outro modelo', async () => {
  for (const [status, code] of [
    [401, 'invalid_api_key'],
    [429, 'insufficient_quota'],
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
  for (const code of [404, 403, 429, 500]) {
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
    return Response.json(result([{ type: 'output_text', text: 'Tudo certo.' }]));
  });
  await service(messages);
  await service(messages, { detail: 'detailed' });
  assert.equal(sent[0].max_output_tokens, 360);
  assert.equal(sent[1].max_output_tokens, 800);
});

test('resposta parcial útil não dispara nova cobrança e informa limite', async () => {
  let calls = 0;
  const service = createAiService({ ...config, fastModel: 'fast' }, async () => {
    calls++;
    return Response.json({
      ...result([{ type: 'output_text', text: 'Comece por src/.' }]),
      status: 'incomplete',
      incomplete_details: { reason: 'max_output_tokens' },
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
      if (calls === 2)
        return Response.json(result([{ type: 'output_text', text: 'Resposta alternativa.' }]));
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

test('tipo insufficient_quota prevalece mesmo quando código específico é diferente', async () => {
  let calls = 0;
  const service = createAiService({ ...config, fastModel: 'fast' }, async () => {
    calls++;
    return Response.json(
      { error: { code: 'credit_balance_exhausted', type: 'insufficient_quota' } },
      { status: 429 },
    );
  });
  await assert.rejects(
    service(messages),
    (error) => error.status === 429 && /cota/.test(error.message),
  );
  assert.equal(calls, 1);
});
