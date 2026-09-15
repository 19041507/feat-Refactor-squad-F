import test from 'node:test';
import assert from 'node:assert/strict';
import { createAiService } from '../src/backend/services/ai.service.js';

const config = { apiKey: 'test-key-not-real', model: 'test-model', timeoutMs: 100 };
const messages = [{ role: 'user', content: 'Como organizar meu projeto?' }];
const result = (content) => ({ status: 'completed', output: [
  { type: 'reasoning', summary: [] },
  { type: 'message', role: 'assistant', content },
] });

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
  const service = createAiService(config, async () => Response.json(result([
    { type: 'refusal', refusal: 'Não posso ajudar com isso.' },
  ])));
  assert.equal(await service(messages), 'Não posso ajudar com isso.');
  for (const payload of [{ output: [] }, { status: 'incomplete', output: [] }]) {
    await assert.rejects(createAiService(config, async () => Response.json(payload))(messages),
      error => error.status === 502);
  }
});

test('sem chave não realiza chamada externa', async () => {
  let called = false;
  await assert.rejects(createAiService({ ...config, apiKey: '' }, async () => {
    called = true;
  })(messages), error => error.status === 503);
  assert.equal(called, false);
});

for (const [upstream, expected] of [[401, 503], [403, 503], [429, 429], [500, 502]]) {
  test(`erro ${upstream} do provedor vira ${expected} sem expor detalhes`, async () => {
    const service = createAiService(config, async () => Response.json(
      { error: { message: 'private provider detail test-key-not-real' } }, { status: upstream }));
    await assert.rejects(service(messages), error => {
      assert.equal(error.status, expected);
      assert.doesNotMatch(error.message, /private|test-key/);
      return true;
    });
  });
}

test('timeout e falha de rede geram erros recuperáveis', async () => {
  for (const [name, status] of [['TimeoutError', 504], ['TypeError', 502]]) {
    const service = createAiService(config, async () => { throw Object.assign(new Error('network'), { name }); });
    await assert.rejects(service(messages), error => error.status === status);
  }
});
