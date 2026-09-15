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

function appendMessage(role, content) {
  const article = document.createElement('article');
  article.dataset.role = role;
  const title = document.createElement('h3');
  title.textContent = role === 'user' ? 'Você' : 'Fê · Squad F';
  const text = document.createElement('p');
  text.textContent = content;
  article.append(title, text);
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
