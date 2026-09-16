import { planReply, buildInstructions } from './chat-policy.js';

export class ChatError extends Error {
  constructor(status, message, retryable = false) {
    super(message);
    this.status = status;
    this.retryable = retryable;
  }
}

function providerError(response, data) {
  const status = response.status;
  const details = Array.isArray(data?.error?.details) ? data.error.details : [];
  if ([400, 401, 403].includes(status))
    return new ChatError(503, 'A conexão com a IA precisa ser revisada. Tente mais tarde.');
  if (status === 429) {
    const exhausted = details.some(
      (item) =>
        item['@type']?.endsWith('/google.rpc.QuotaFailure') &&
        item.violations?.some(
          (v) => /PerDay/i.test(v.quotaId || '') || String(v.quotaValue) === '0',
        ),
    );
    if (exhausted)
      return new ChatError(429, 'O serviço de IA está sem cota disponível no momento.');
    const error = new ChatError(
      429,
      'A IA está recebendo muitas mensagens. Tente daqui a pouco.',
      true,
    );
    const retry = details.find((item) =>
      item['@type']?.endsWith('/google.rpc.RetryInfo'),
    )?.retryDelay;
    const header = response.headers.get('retry-after');
    const delay =
      typeof retry === 'string' && /^\d+(\.\d+)?s$/.test(retry) ? parseFloat(retry) * 1000 : 0;
    const headerDelay =
      header === null
        ? 0
        : /^\d+(\.\d+)?$/.test(header)
          ? Number(header) * 1000
          : Date.parse(header) - Date.now();
    error.retryAfterMs = Math.max(delay, Number.isFinite(headerDelay) ? headerDelay : 0, 0);
    return error;
  }
  return new ChatError(
    status === 404 ? 503 : 502,
    'Não consegui consultar a IA agora. Tente novamente.',
    status === 404 || status === 408 || status >= 500,
  );
}

function extractReply(data) {
  const candidate = data?.candidates?.[0];
  const reason = candidate?.finishReason;
  if (
    data?.promptFeedback?.blockReason ||
    ['SAFETY', 'RECITATION', 'BLOCKLIST', 'PROHIBITED_CONTENT', 'SPII', 'IMAGE_SAFETY'].includes(
      reason,
    )
  ) {
    return 'Não consigo responder a esse pedido. Pode reformular a pergunta?';
  }
  if (!['STOP', 'MAX_TOKENS'].includes(reason))
    throw new ChatError(502, 'A IA não concluiu a resposta. Tente novamente.', true);
  const parts = candidate?.content?.parts;
  const text = (Array.isArray(parts) ? parts : [])
    .filter((part) => part.thought !== true && typeof part.text === 'string')
    .map((part) => part.text)
    .join('')
    .trim();
  if (!text) throw new ChatError(502, 'A IA retornou uma resposta vazia. Tente novamente.', true);
  return reason === 'MAX_TOKENS'
    ? text + '\n\nAtingi o limite desta resposta. Peça para continuar se precisar.'
    : text;
}

export function createAiService(config, fetchImpl = fetch) {
  return async function reply(messages, { detail = 'brief' } = {}) {
    if (!config.apiKey) {
      throw new ChatError(503, 'O chat ainda não está disponível. Tente novamente mais tarde.');
    }
    const plan = planReply(messages, config, detail);
    const deadline = Date.now() + config.timeoutMs;
    let lastError;
    for (const [index, model] of plan.models.entries()) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) break;
      // Reserve time for the alternative, without exceeding the total request budget.
      const attemptMs = Math.max(1, Math.floor(remaining / (plan.models.length - index)));
      try {
        const response = await fetchImpl(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
          {
            method: 'POST',
            headers: { 'x-goog-api-key': config.apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: buildInstructions(plan.detail) }] },
              contents: plan.input.map((message) => ({
                role: message.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: message.content }],
              })),
              generationConfig: {
                // Flash shares the output budget with internal reasoning.
                maxOutputTokens: plan.maxTokens + (model === 'gemini-3.6-flash' ? 2048 : 0),
                thinkingConfig: {
                  thinkingLevel: model === 'gemini-3.5-flash-lite' ? 'minimal' : 'medium',
                },
              },
            }),
            signal: AbortSignal.timeout(attemptMs),
          },
        );
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw providerError(response, data);
        }
        return extractReply(await response.json());
      } catch (error) {
        lastError =
          error instanceof ChatError
            ? error
            : ['TimeoutError', 'AbortError'].includes(error.name)
              ? new ChatError(504, 'A resposta demorou mais que o esperado. Tente novamente.', true)
              : new ChatError(502, 'Não consegui conectar à IA. Tente novamente.', true);
        if (!lastError.retryable) throw lastError;
        if (lastError.retryAfterMs && index < plan.models.length - 1) {
          if (lastError.retryAfterMs >= deadline - Date.now()) throw lastError;
          await new Promise((resolve) => setTimeout(resolve, lastError.retryAfterMs));
        }
      }
    }
    throw lastError || new ChatError(504, 'O tempo para responder acabou. Tente novamente.');
  };
}
