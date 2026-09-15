import express from 'express';
import { join } from 'node:path';
import { projectRoot } from '../../config/env.js';
import { ChatError, createAiService } from './services/ai.service.js';
import { createChatRouter } from './routes/chat.routes.js';

export function createApp({ config, fetchImpl = fetch }) {
  const app = express();
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'same-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self' mailto:",
    });
    next();
  });
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    const origin = req.get('origin');
    if (origin && origin !== `${req.protocol}://${req.get('host')}`) {
      return res.status(403).json({ error: 'Origem não permitida.' });
    }
    next();
  });
  app.use(express.json({ limit: '256kb' }));
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/chat', createChatRouter(createAiService(config, fetchImpl)));
  app.use('/assets', express.static(join(projectRoot, 'assets'), { dotfiles: 'deny' }));
  app.use(express.static(join(projectRoot, 'src/frontend'), { dotfiles: 'deny' }));
  app.use((req, res) => res.status(404).json({ error: 'Página ou recurso não encontrado.' }));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error instanceof ChatError) return res.status(error.status).json({ error: error.message });
    if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Mensagem muito grande.' });
    if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Envie um JSON válido.' });
    res.status(500).json({ error: 'Não foi possível concluir a solicitação.' });
  });
  return app;
}
