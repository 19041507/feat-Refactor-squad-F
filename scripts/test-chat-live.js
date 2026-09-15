// Explicit opt-in only: this command makes paid API calls using the local .env.
import { once } from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';
import { loadLocalEnv, readConfig } from '../config/env.js';
import { createApp } from '../src/backend/app.js';

loadLocalEnv();
const config = readConfig();
if (!config.apiKey) {
  console.error('Preencha OPENAI_API_KEY no .env antes do teste real.');
  process.exit(1);
}
const report = { date: new Date().toISOString(), cases: [] };
let calls = [];
const measuredFetch = async (url, options) => {
  const payload = JSON.parse(options.body);
  const start = Date.now();
  const response = await fetch(url, options);
  const result = await response
    .clone()
    .json()
    .catch(() => ({}));
  calls.push({
    model: payload.model,
    status: response.status,
    milliseconds: Date.now() - start,
    maxOutputTokens: payload.max_output_tokens,
    inputCharacters: payload.input.reduce((sum, m) => sum + m.content.length, 0),
    usage: result.usage
      ? {
          input: result.usage.input_tokens,
          output: result.usage.output_tokens,
          total: result.usage.total_tokens,
        }
      : null,
  });
  return response;
};
const server = createApp({ config, fetchImpl: measuredFetch }).listen(0, '127.0.0.1');
await once(server, 'listening');
let history = [];
const cases = [
  { name: 'saudacao-economica', message: 'Oi!' },
  { name: 'orientacao-curta', message: 'Como separo HTML, CSS e JavaScript num projeto pequeno?' },
  {
    name: 'contexto-com-detalhes',
    message: 'Me dê um exemplo dessa estrutura e explique cada pasta.',
    detail: 'detailed',
  },
];
try {
  for (const item of cases) {
    calls = [];
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: item.message, detail: item.detail || 'brief', history }),
    });
    const body = await response.json();
    const row = {
      name: item.name,
      status: response.status,
      calls,
      reply: body.reply || null,
      error: body.error || null,
      words: body.reply?.trim().split(/\s+/).length || 0,
    };
    report.cases.push(row);
    console.log(JSON.stringify(row, null, 2));
    if (!response.ok || !body.reply) {
      process.exitCode = 1;
      break;
    }
    history.push(
      { role: 'user', content: item.message },
      { role: 'assistant', content: body.reply },
    );
  }
} finally {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  await mkdir('test-results', { recursive: true });
  await writeFile('test-results/chat-live.json', JSON.stringify(report, null, 2));
}
