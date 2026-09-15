import { ChatError } from '../services/ai.service.js';

export function createChatController(reply) {
  return async (req, res) => {
    const { message, history = [], detail = 'brief' } = req.body ?? {};
    if (!['brief', 'detailed'].includes(detail)) {
      throw new ChatError(400, 'Escolha uma resposta direta ou com mais detalhes.');
    }
    if (typeof message !== 'string' || !message.trim() || message.length > 2000) {
      throw new ChatError(400, 'Escreva uma mensagem de até 2.000 caracteres.');
    }
    if (!Array.isArray(history) || history.length > 10 || history.length % 2 !== 0) {
      throw new ChatError(400, 'O histórico da conversa é inválido. Inicie uma nova conversa.');
    }
    const messages = history.map((item, index) => {
      const role = index % 2 === 0 ? 'user' : 'assistant';
      const max = role === 'user' ? 2000 : 10000;
      if (
        !item ||
        item.role !== role ||
        typeof item.content !== 'string' ||
        !item.content.trim() ||
        item.content.length > max
      ) {
        throw new ChatError(400, 'O histórico da conversa é inválido. Inicie uma nova conversa.');
      }
      return { role, content: item.content.trim() };
    });
    messages.push({ role: 'user', content: message.trim() });
    res.json({ reply: await reply(messages, { detail }) });
  };
}
