const form = document.querySelector('#chat-form');
const input = document.querySelector('#message');
const send = form.querySelector('button[type="submit"]');
const reset = document.querySelector('#new-chat');
const messages = document.querySelector('#messages');
const welcome = document.querySelector('#chat-welcome');
const status = document.querySelector('#chat-status');
const errorBox = document.querySelector('#chat-error');
const scroll = document.querySelector('#chat-scroll');
const detail = document.querySelector('#response-detail');
let history = [];
let busy = false;

const portfolioDestinations = [
  {
    label: 'Conhecer a equipe',
    href: '/pages/sobre.html',
    pattern: /\b(sobre|equipe|integrantes?|pessoas?)\b/,
  },
  {
    label: 'Ver projetos',
    href: '/pages/projetos.html',
    pattern: /\b(projetos?|trabalhos?)\b/,
  },
  {
    label: 'Explorar habilidades',
    href: '/pages/habilidades.html',
    pattern: /\b(habilidades?|competencias?)\b/,
  },
  {
    label: 'Conhecer os serviços',
    href: '/pages/servicos.html',
    pattern: /\b(servicos?|solucoes?)\b/,
  },
  {
    label: 'Ler depoimentos',
    href: '/pages/depoimentos.html',
    pattern: /\b(depoimentos?|relatos?)\b/,
  },
  {
    label: 'Ver estudo de caso',
    href: '/pages/case-de-sucesso.html',
    pattern: /\b(estudo de caso|case de sucesso|case)\b/,
  },
  {
    label: 'Ir para contato',
    href: '/pages/contato.html',
    pattern: /\b(contato|fale conosco|mensagem)\b/,
  },
];

function normalizeText(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function appendRecommendations(article, content) {
  const normalized = normalizeText(content);
  const destinations = portfolioDestinations
    .map((destination) => ({ ...destination, position: normalized.search(destination.pattern) }))
    .filter((destination) => destination.position >= 0)
    .sort((first, second) => first.position - second.position)
    .slice(0, 2);
  if (!destinations.length) return;

  const nav = document.createElement('nav');
  nav.className = 'message-recommendations';
  nav.setAttribute('aria-label', 'Continue explorando');
  const title = document.createElement('span');
  title.className = 'recommendations-title';
  title.textContent = 'Continue explorando';
  const links = document.createElement('div');
  links.className = 'recommendations-links';
  destinations.forEach(({ label, href }) => {
    const link = document.createElement('a');
    link.href = href;
    link.textContent = label;
    const arrow = document.createElement('span');
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = ' →';
    link.append(arrow);
    links.append(link);
  });
  nav.append(title, links);
  article.append(nav);
}

function appendMessage(role, content) {
  const article = document.createElement('article');
  article.dataset.role = role;
  const title = document.createElement('h3');
  title.textContent = role === 'user' ? 'Você' : 'Fê · Squad F';
  const text = document.createElement('p');
  text.textContent = content;
  article.append(title, text);
  if (role === 'assistant') appendRecommendations(article, content);
  messages.append(article);
  return article;
}

function setBusy(value) {
  busy = value;
  send.disabled = value;
  reset.disabled = value;
  detail.disabled = value;
  input.readOnly = value;
  send.textContent = value ? 'Enviando…' : 'Enviar mensagem ↗';
  send.setAttribute('aria-label', value ? 'Enviando…' : 'Enviar mensagem');
  form.setAttribute('aria-busy', String(value));
  document.querySelectorAll('.suggestions button').forEach((button) => {
    button.disabled = value;
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (busy) return;
  const message = input.value.trim();
  if (!message) {
    input.focus();
    return;
  }
  errorBox.hidden = true;
  status.textContent = 'Fê está pensando…';
  setBusy(true);
  welcome.hidden = true;
  const pending = appendMessage('user', message);
  scroll.scrollTop = scroll.scrollHeight;
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history: history.slice(-10), detail: detail.value }),
      signal: AbortSignal.timeout(130000),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Não foi possível enviar. Tente novamente.');
    if (typeof data.reply !== 'string' || !data.reply.trim())
      throw new Error('Resposta vazia. Tente novamente.');
    welcome.hidden = true;
    appendMessage('assistant', data.reply);
    history.push({ role: 'user', content: message }, { role: 'assistant', content: data.reply });
    history = history.slice(-10);
    input.value = '';
    status.textContent = 'Resposta recebida.';
    scroll.scrollTop = scroll.scrollHeight;
  } catch (error) {
    pending.remove();
    welcome.hidden = messages.childElementCount > 0;
    status.textContent = '';
    errorBox.textContent =
      error.name === 'TimeoutError'
        ? 'A resposta demorou muito. Tente novamente.'
        : error instanceof TypeError || error instanceof SyntaxError
          ? 'Não foi possível conectar. Verifique sua conexão e tente novamente.'
          : error.message;
    errorBox.hidden = false;
  } finally {
    setBusy(false);
    input.focus();
  }
});

input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    if (!busy) form.requestSubmit();
  }
});
reset.addEventListener('click', () => {
  history = [];
  messages.replaceChildren();
  welcome.hidden = false;
  errorBox.hidden = true;
  status.textContent = 'Nova conversa iniciada.';
  input.value = '';
  input.focus();
});
document.querySelectorAll('.suggestions button').forEach((button) => {
  button.addEventListener('click', () => {
    input.value = button.textContent;
    input.focus();
  });
});
