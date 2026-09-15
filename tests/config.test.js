import test from 'node:test';
import assert from 'node:assert/strict';

import { readConfig } from '../config/env.js';

test('configuração funciona sem chave e normaliza a chave quando fornecida', () => {
  assert.equal(readConfig({}).apiKey, '');
  assert.equal(readConfig({ OPENAI_API_KEY: '  teste  ' }).apiKey, 'teste');
  assert.equal(readConfig({ PORT: '4200' }).port, 4200);
  assert.equal(readConfig({ OPENAI_MODEL: 'meu-modelo' }).model, 'meu-modelo');
});

test('configuração rejeita porta e timeout inválidos antes de iniciar', () => {
  for (const port of ['abc', '-1', '0', '65536', '2.5']) {
    assert.throws(() => readConfig({ PORT: port }), /PORT/);
  }
  assert.throws(() => readConfig({ AI_TIMEOUT_MS: 'zero' }), /AI_TIMEOUT_MS/);
});

test('configura modelos e limites sem aceitar orçamento descontrolado', () => {
  const config = readConfig({
    OPENAI_FAST_MODEL: 'fast',
    OPENAI_FALLBACK_MODEL: 'backup',
    AI_BRIEF_TOKENS: '250',
  });
  assert.equal(config.fastModel, 'fast');
  assert.equal(config.fallbackModel, 'backup');
  assert.equal(config.briefTokens, 250);
  assert.throws(() => readConfig({ AI_BRIEF_TOKENS: '999999' }), /AI_BRIEF_TOKENS/);
  assert.throws(() => readConfig({ AI_CONTEXT_CHARS: '30' }), /AI_CONTEXT_CHARS/);
});
