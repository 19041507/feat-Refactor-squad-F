const WORD_DELAY = 140;

function wrapWords(element) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  let wordIndex = 0;
  textNodes.forEach((textNode) => {
    const fragment = document.createDocumentFragment();
    textNode.textContent.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) {
        fragment.append(document.createTextNode(part));
        return;
      }
      const word = document.createElement('span');
      word.className = 'blur-text-word';
      word.style.setProperty('--blur-delay', `${wordIndex * WORD_DELAY}ms`);
      word.textContent = part;
      fragment.append(word);
      wordIndex++;
    });
    textNode.replaceWith(fragment);
  });
}

export function initBlurText() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.querySelectorAll('[data-blur-text]').forEach((element) => {
    wrapWords(element);
    element.classList.add('blur-text');

    if (!('IntersectionObserver' in window)) {
      element.classList.add('is-visible');
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        element.classList.add('is-visible');
        observer.disconnect();
      },
      { threshold: 0.1 },
    );
    observer.observe(element);
  });
}
