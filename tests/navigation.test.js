import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

const root = resolve('src/frontend');
const pages = [
  'index.html',
  ...[
    'sobre',
    'projetos',
    'habilidades',
    'servicos',
    'depoimentos',
    'case-de-sucesso',
    'contato',
    'chat',
  ].map((name) => `pages/${name}.html`),
];

for (const page of pages) {
  test(`${page}: entrada, imagens, estilos e links locais existem`, async () => {
    let html;
    try {
      html = await readFile(resolve(root, page), 'utf8');
    } catch {
      assert.fail(`Página não encontrada na estrutura final: ${page}`);
    }
    for (const [, ref] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (ref.startsWith('#') || /^[a-z]+:/i.test(ref)) continue;
      const file = ref.startsWith('/assets/')
        ? resolve(`.${ref}`)
        : ref.startsWith('/')
          ? resolve(root, `.${ref}`)
          : resolve(dirname(resolve(root, page)), ref);
      await assert.doesNotReject(access(file), `${page}: recurso inexistente ${ref}`);
    }
  });
}
