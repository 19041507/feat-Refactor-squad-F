import { planReply, buildInstructions } from './chat-policy.js';

export class ChatError extends Error {
  constructor(status, message, retryable = false) {
    super(message);
    this.status = status;
    this.retryable = retryable;
  }
}

function providerError(status, code) {
  if (status === 401)
    return new ChatError(503, 'A conexão com a IA precisa ser revisada. Tente mais tarde.');
  if (['insufficient_quota', 'billing_hard_limit_reached', 'billing_not_active'].includes(code)) {
    return new ChatError(429, 'O serviço de IA está sem cota disponível no momento.');
  }
  if (status === 429)
    return new ChatError(429, 'A IA está recebendo muitas mensagens. Tente daqui a pouco.', true);
  if ([403, 404].includes(status))
    return new ChatError(503, 'Os modelos de IA estão indisponíveis no momento.', true);
  return new ChatError(
    502,
    'Não consegui consultar a IA agora. Tente novamente.',
    status >= 500 || status === 408,
  );
}

function extractReply(data) {
  const partial =
    data.status === 'incomplete' && data.incomplete_details?.reason === 'max_output_tokens';
  if ((!partial && data.status !== 'completed') || !Array.isArray(data.output)) {
    throw new ChatError(502, 'A IA não concluiu a resposta. Tente novamente.', true);
  }
  const text = data.output
    .filter((item) => item.type === 'message' && item.role === 'assistant')
    .flatMap((item) => (Array.isArray(item.content) ? item.content : []))
    .map((item) =>
      item.type === 'output_text' ? item.text : item.type === 'refusal' ? item.refusal : '',
    )
    .filter((value) => typeof value === 'string' && value.trim())
    .join('\n')
    .trim();
  if (!text) throw new ChatError(502, 'A IA retornou uma resposta vazia. Tente novamente.', true);
  return partial
    ? `${text}\n\nAtingi o limite desta resposta. Peça para continuar se precisar.`
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
        const response = await fetchImpl('https://api.openai.com/v1/responses', {
          method: 'POST',
          headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            instructions: buildInstructions(plan.detail),
            input: plan.input,
            max_output_tokens: plan.maxTokens,
            store: false,
          }),
          signal: AbortSignal.timeout(attemptMs),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw providerError(response.status, data.error?.code || data.error?.type);
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
      }
    }
    throw lastError || new ChatError(504, 'O tempo para responder acabou. Tente novamente.');
  };
}
