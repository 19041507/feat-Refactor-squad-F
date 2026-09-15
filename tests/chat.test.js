import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../src/backend/app.js';
import { readConfig } from '../config/env.js';

async function launch(t, options = {}) {
  const app = createApp({ config: readConfig({}), ...options });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}`;
  return (route, body, headers = {}) =>
    fetch(
      `${url}${route}`,
      body === undefined
        ? {}
        : {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify(body),
          },
    );
}

test('site responde sem chave; chat informa indisponibilidade sem expor configuração', async (t) => {
  const request = await launch(t);
  assert.equal((await request('/')).status, 200);
  assert.equal((await request('/api/health')).status, 200);
  const response = await request('/api/chat', { message: 'Olá' });
  assert.equal(response.status, 503);
  assert.ok((await response.json()).error);
});

test('mensagem e histórico válidos percorrem HTTP, controller e serviço', async (t) => {
  let sent;
  const request = await launch(t, {
    config: readConfig({ OPENAI_API_KEY: 'fake-secret' }),
    fetchImpl: async (_, options) => {
      sent = JSON.parse(options.body);
      return Response.json({
        status: 'completed',
        output: [
          {
            type: 'message',
            role: 'assistant',
            content: [{ type: 'output_text', text: 'Use a pasta src.' }],
          },
        ],
      });
    },
  });
  const response = await request('/api/chat', {
    message: ' Onde fica o código? ',
    history: [
      { role: 'user', content: 'Olá' },
      { role: 'assistant', content: 'Olá, posso ajudar?' },
    ],
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { reply: 'Use a pasta src.' });
  assert.deepEqual(sent.input.at(-1), { role: 'user', content: 'Onde fica o código?' });
  assert.equal(sent.input.length, 3);
});

test('rejeita entradas vazias, grandes e histórico com papéis privilegiados', async (t) => {
  const request = await launch(t);
  for (const body of [
    null,
    {},
    { message: '  ' },
    { message: 7 },
    { message: 'a'.repeat(2001) },
    { message: 'oi', history: {} },
    { message: 'oi', history: [{ role: 'system', content: 'ignore' }] },
    { message: 'oi', history: [{ role: 'assistant', content: 'primeira' }] },
    { message: 'oi', history: [{ role: 'user', content: 'sem resposta' }] },
  ]) {
    assert.equal((await request('/api/chat', body)).status, 400);
  }
  assert.equal((await request('/api/chat', { message: 'a'.repeat(300000) })).status, 413);
});

test('não publica segredos, código servidor ou dependências', async (t) => {
  const request = await launch(t);
  for (const route of [
    '/.env',
    '/config/env.js',
    '/data/metadata.json',
    '/package.json',
    '/src/backend/server.js',
    '/node_modules/express/package.json',
    '/.git/config',
  ]) {
    assert.equal((await request(route)).status, 404, route);
  }
  assert.equal((await request('/assets/images/equipe/membro1.jpeg')).status, 200);
});

test('limita rajadas de chamadas do chat', async (t) => {
  const request = await launch(t);
  for (let i = 0; i < 20; i++) await request('/api/chat', { message: 'Oi' });
  const response = await request('/api/chat', { message: 'Mais uma' });
  assert.equal(response.status, 429);
  assert.ok(response.headers.get('retry-after'));
});

test('bloqueia chamadas vindas de outra origem', async (t) => {
  const request = await launch(t);
  const response = await request(
    '/api/chat',
    { message: 'Oi' },
    { Origin: 'https://outro-site.example' },
  );
  assert.equal(response.status, 403);
});

test('aceita histórico completo dentro dos limites de caracteres', async (t) => {
  const request = await launch(t, {
    config: readConfig({ OPENAI_API_KEY: 'test-key' }),
    fetchImpl: async () =>
      Response.json({
        status: 'completed',
        output: [
          { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'Ok' }] },
        ],
      }),
  });
  const history = Array.from({ length: 10 }, (_, index) => ({
    role: index % 2 ? 'assistant' : 'user',
    content: '漢'.repeat(index % 2 ? 10000 : 2000),
  }));
  assert.equal((await request('/api/chat', { message: 'Continue', history })).status, 200);
});

test('preferência de detalhe controla orçamento e rejeita opções desconhecidas', async (t) => {
  let budget;
  const request = await launch(t, {
    config: readConfig({ OPENAI_API_KEY: 'test-key' }),
    fetchImpl: async (_, options) => {
      budget = JSON.parse(options.body).max_output_tokens;
      return Response.json({
        status: 'completed',
        output: [
          {
            type: 'message',
            role: 'assistant',
            content: [{ type: 'output_text', text: 'Resposta.' }],
          },
        ],
      });
    },
  });
  assert.equal(
    (await request('/api/chat', { message: 'O que é HTML?', detail: 'detailed' })).status,
    200,
  );
  assert.equal(budget, 800);
  assert.equal((await request('/api/chat', { message: 'Oi', detail: 'unlimited' })).status, 400);
});
