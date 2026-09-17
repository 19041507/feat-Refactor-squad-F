const links = [
  ['Início', '/index.html'],
  ['Sobre', '/pages/sobre.html'],
  ['Projetos', '/pages/projetos.html'],
  ['Habilidades', '/pages/habilidades.html'],
  ['Serviços', '/pages/servicos.html'],
  ['Depoimentos', '/pages/depoimentos.html'],
  ['Estudo de caso', '/pages/case-de-sucesso.html'],
  ['Contato', '/pages/contato.html'],
  ['Chat com IA', '/pages/chat.html'],
];
const current = location.pathname === '/' ? '/index.html' : location.pathname;
const header = document.querySelector('[data-site-header]');
if (header) {
  header.innerHTML = `
    <div class="header-inner">
      <a class="brand" href="/index.html" aria-label="Squad F — início"><span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M5 5h22v6H12v4h12v6H12v6H5V5Z"/><path d="m23 20 4 4-4 4-4-4 4-4Z"/></svg></span><span>Squad F</span></a>
      <button type="button" class="menu-toggle" aria-expanded="false" aria-controls="main-nav" aria-label="Abrir menu">Menu ☰</button>
      <nav class="main-nav" id="main-nav" aria-label="Principal"><ul>${links
        .map(
          ([label, href]) =>
            `<li><a href="${href}"${href === current ? ' aria-current="page"' : ''}${label === 'Chat com IA' ? ' class="chat-link"' : ''}>${label}</a></li>`,
        )
        .join('')}</ul></nav>
    </div>`;
  const toggle = header.querySelector('button');
  const nav = header.querySelector('nav');
  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    nav.classList.toggle('is-open', open);
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  header.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setOpen(false);
      toggle.focus();
    }
  });
}
const footer = document.querySelector('[data-site-footer]');
if (footer) {
  footer.innerHTML = `<div class="footer-inner"><p><strong>Squad F.</strong> Tecnologia e aprendizado em equipe.<br>Portfólio acadêmico · ${new Date().getFullYear()}</p><a href="/pages/chat.html">Converse com nossa IA ↗</a></div>`;
}
