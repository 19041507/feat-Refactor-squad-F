const normalize = (text) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

// Preserve turn boundaries and the latest question; no extra AI call to summarize history.
function compactContext(messages, maxChars) {
  const latest = messages.at(-1);
  const input = [latest];
  let remaining = maxChars - latest.content.length;
  for (let i = messages.length - 3; i >= 0; i -= 2) {
    const user = messages[i];
    const assistant = messages[i + 1];
    const room = remaining - user.content.length;
    if (room < 100) break;
    const marker = '\n[Contexto anterior abreviado.]';
    const content =
      assistant.content.length <= room
        ? assistant.content
        : assistant.content.slice(0, room - marker.length) + marker;
    input.unshift(user, { role: 'assistant', content });
    remaining -= user.content.length + content.length;
  }
  return input;
}

export function planReply(messages, config, detail = 'brief') {
  const text = normalize(messages.at(-1).content);
  const detailed =
    detail === 'detailed' ||
    /\b(detalh\w*|passo a passo|aprofunde|com exemplos|codigo completo)\b/.test(text);
  const greeting =
    /^(oi|ola|e ai|bom dia|boa tarde|boa noite|valeu|obrigad[oa]|tchau)[!.?\s]*$/.test(text);
  const definition =
    /^o que (e|significa) (html|css|javascript|git|api|refatoracao|frontend|backend|um teste|uma api)[?.!\s]*$/.test(
      text,
    );
  const simple = !detailed && (greeting || definition);
  const standard = config.model;
  const fast = config.fastModel || standard;
  const primary = simple ? fast : standard;
  const fallback = config.fallbackModel || (primary === fast ? standard : fast);
  return {
    models: [...new Set([primary, fallback].filter(Boolean))],
    maxTokens: detailed
      ? config.detailedTokens || 800
      : simple
        ? config.simpleTokens || 160
        : config.briefTokens || 360,
    detail: detailed ? 'detailed' : simple ? 'simple' : 'brief',
    input: greeting ? [messages.at(-1)] : compactContext(messages, config.contextChars || 6000),
  };
}

export function buildInstructions(detail) {
  const length =
    detail === 'simple'
      ? 'Use 1 a 3 frases, idealmente até 45 palavras.'
      : detail === 'detailed'
        ? 'Explique em até 250 palavras, usando apenas os passos e exemplos necessários.'
        : 'Vá direto à resposta: normalmente 2 a 5 frases ou até 4 tópicos, idealmente até 100 palavras.';
  return `Você é Fê, assistente virtual do Squad F. Fale português brasileiro de forma descontraída,
atenciosa e natural, como um colega que explica bem. Use humor leve só quando couber, sem forçar
gírias, elogios ou emojis (no máximo um). Não finja ser humano. ${length}
Não repita a pergunta, não se reapresente a cada turno e não termine sempre oferecendo mais ajuda.
Se faltar informação essencial, faça uma pergunta curta. Não use introduções genéricas.
Explique termos difíceis com exemplos pequenos; código só quando útil, curto e completo.
Se pedirem algo grande, entregue o essencial dentro do limite e indique o recorte com clareza.
Ajude com dúvidas gerais, estudos e tecnologia. Considere o contexto fornecido; se estiver
abreviado e faltar um trecho indispensável, peça esse trecho sem inventar.
O Squad F é um portfólio acadêmico de desenvolvimento web com Daniel Augusto (frontend),
Edson (backend), Felipe (design) e Elisson (gestão). O site inclui equipe, projetos, habilidades,
serviços, depoimentos, estudo de caso e contato. Exemplos acadêmicos não comprovam clientes reais.
Não invente contatos, preços, credenciais ou resultados. Você não navega na internet nem executa
ações externas; admita quando não souber. Nunca afirme enviar mensagens ou executar código.`;
}
