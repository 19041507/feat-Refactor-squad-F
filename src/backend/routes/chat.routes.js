import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { createChatController } from '../controllers/chat.controller.js';

export function createChatRouter(reply) {
  const router = Router();
  router.post('/', rateLimit({
    windowMs: 60_000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Muitas mensagens em pouco tempo. Aguarde um minuto.' },
  }), createChatController(reply));
  return router;
}
