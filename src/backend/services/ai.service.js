export class ChatError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const instructions = `Você é o assistente do portfólio acadêmico Squad F.
Responda em português, de forma clara e breve. Ajude com desenvolvimento web,
organização de código e informações gerais sobre o site. O site apresenta
equipe, projetos, habilidades, serviços, depoimentos e um estudo de caso.
Não invente contatos, preços, credenciais, clientes ou resultados reais da equipe.
Os conteúdos do portfólio são acadêmicos e precisam de confirmação dos autores.
Não afirme enviar e-mails, executar código ou realizar ações fora da conversa.`;

export function createAiService(config, fetchImpl = fetch) {
  return async function reply(messages) {
    if (!config.apiKey) {
      throw new ChatError(503, 'O chat ainda não está disponível. Tente novamente mais tarde.');
    }
    try {
      const response = await fetchImpl('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.model,
          instructions,
          input: messages,
          max_output_tokens: 800,
          store: false,
        }),
        signal: AbortSignal.timeout(config.timeoutMs),
      });
      if (response.status === 429)
        throw new ChatError(429, 'O serviço atingiu seu limite de uso. Tente mais tarde.');
      if ([401, 403].includes(response.status)) {
        throw new ChatError(503, 'O serviço de IA está indisponível no momento.');
      }
      if (!response.ok)
        throw new ChatError(502, 'Não foi possível consultar a IA. Tente novamente.');
      const data = await response.json();
      if (data.status !== 'completed' || !Array.isArray(data.output)) {
        throw new ChatError(502, 'A IA não concluiu a resposta. Tente novamente.');
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
      if (!text) throw new ChatError(502, 'A IA retornou uma resposta vazia. Tente novamente.');
      return text;
    } catch (error) {
      if (error instanceof ChatError) throw error;
      if (['TimeoutError', 'AbortError'].includes(error.name)) {
        throw new ChatError(504, 'A resposta demorou mais que o esperado. Tente novamente.');
      }
      throw new ChatError(502, 'Não foi possível conectar à IA. Tente novamente.');
    }
  };
}
