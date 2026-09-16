import { loadLocalEnv, readConfig } from '../../config/env.js';
import { createApp } from './app.js';

loadLocalEnv();
const config = readConfig();
const server = createApp({ config }).listen(config.port, config.host, () => {
  console.log(`Squad F: http://${config.host}:${config.port}`);
  if (!config.apiKey) console.log('Chat pendente: preencha GEMINI_API_KEY no .env e reinicie.');
});
server.on('error', (error) => {
  console.error(
    error.code === 'EADDRINUSE'
      ? 'Porta ocupada. Altere PORT no .env ou encerre o outro servidor.'
      : `Não foi possível iniciar o servidor (${error.code}).`,
  );
  process.exitCode = 1;
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000).unref();
  });
}
