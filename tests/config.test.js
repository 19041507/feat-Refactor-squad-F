import test from 'node:test';
import assert from 'node:assert/strict';

import { readConfig } from '../config/env.js';

test('configuração funciona sem chave e normaliza a chave quando fornecida', () => {
  assert.equal(readConfig({}).apiKey, '');
  assert.equal(readConfig({ GEMINI_API_KEY: '  teste  ' }).apiKey, 'teste');
  assert.equal(readConfig({ PORT: '4200' }).port, 4200);
  assert.equal(readConfig({ GEMINI_MODEL: 'gemini-2.5-flash' }).model, 'gemini-2.5-flash');
});

test('configuração rejeita porta e timeout inválidos antes de iniciar', () => {
  for (const port of ['abc', '-1', '0', '65536', '2.5']) {
    assert.throws(() => readConfig({ PORT: port }), /PORT/);
  }
  assert.throws(() => readConfig({ AI_TIMEOUT_MS: 'zero' }), /AI_TIMEOUT_MS/);
});

test('configura modelos e limites sem aceitar orçamento descontrolado', () => {
  const config = readConfig({
    GEMINI_FAST_MODEL: 'gemini-2.5-flash-lite',
    GEMINI_FALLBACK_MODEL: 'gemini-2.5-flash',
    AI_BRIEF_TOKENS: '250',
  });
  assert.equal(config.fastModel, 'gemini-2.5-flash-lite');
  assert.equal(config.fallbackModel, 'gemini-2.5-flash');
  assert.equal(config.briefTokens, 250);
  assert.throws(() => readConfig({ AI_BRIEF_TOKENS: '999999' }), /AI_BRIEF_TOKENS/);
  assert.throws(() => readConfig({ AI_CONTEXT_CHARS: '30' }), /AI_CONTEXT_CHARS/);
});

test('rejeita modelos incompatíveis com o orçamento sem raciocínio', () => {
  assert.throws(() => readConfig({ GEMINI_MODEL: 'modelo-incompativel' }), /GEMINI_MODEL/);
  assert.throws(() => readConfig({ GEMINI_MODEL: '../private' }), /GEMINI_MODEL/);
});
