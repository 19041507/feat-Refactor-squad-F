const form = document.querySelector('#contact-form');
const preview = document.querySelector('#contact-preview');
const text = document.querySelector('#contact-text');
const status = document.querySelector('#contact-status');
form.querySelector('button[type="submit"]').disabled = false;

form.addEventListener('submit', event => {
  event.preventDefault();
  const fields = new FormData(form);
  const name = fields.get('nome').trim();
  const message = fields.get('mensagem').trim();
  if (!name || !message) {
    status.textContent = 'Preencha seu nome e sua mensagem.';
    return;
  }
  text.value = `Nome: ${name}\nE-mail: ${fields.get('email').trim()}\n\n${message}`;
  preview.hidden = false;
  status.textContent = 'Texto preparado. Nenhuma mensagem foi enviada; copie para compartilhar.';
  text.focus();
});

document.querySelector('#copy-contact').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(text.value);
    status.textContent = 'Mensagem copiada. Cole no canal em que deseja compartilhar.';
  } catch {
    text.focus();
    text.select();
    status.textContent = 'Selecione o texto e use Ctrl+C ou a opção Copiar do seu dispositivo.';
  }
});
