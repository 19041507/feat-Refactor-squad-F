import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';

export const projectRoot = fileURLToPath(new URL('../', import.meta.url));

export function loadLocalEnv() {
  try {
    loadEnvFile(new URL('../.env', import.meta.url));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

export function readConfig(env = process.env) {
  const integer = (name, fallback, max, min = 1) => {
    const value = Number(env[name] || fallback);
    if (!Number.isInteger(value) || value < min || value > max) {
      throw new Error(`${name} deve ser um inteiro entre ${min} e ${max}.`);
    }
    return value;
  };
  const model = (name, fallback) => {
    const value = env[name]?.trim() || fallback;
    if (value && !['gemini-2.5-flash', 'gemini-2.5-flash-lite'].includes(value)) {
      throw new Error(name + ' deve ser gemini-2.5-flash ou gemini-2.5-flash-lite.');
    }
    return value;
  };
  return Object.freeze({
    port: integer('PORT', 3000, 65535),
    host: env.HOST?.trim() || '127.0.0.1',
    apiKey: env.GEMINI_API_KEY?.trim() || '',
    model: model('GEMINI_MODEL', 'gemini-2.5-flash'),
    fastModel: model('GEMINI_FAST_MODEL', 'gemini-2.5-flash-lite'),
    fallbackModel: model('GEMINI_FALLBACK_MODEL', ''),
    simpleTokens: integer('AI_SIMPLE_TOKENS', 160, 500, 64),
    briefTokens: integer('AI_BRIEF_TOKENS', 360, 1000, 128),
    detailedTokens: integer('AI_DETAILED_TOKENS', 800, 1600, 256),
    contextChars: integer('AI_CONTEXT_CHARS', 6000, 12000, 4000),
    timeoutMs: integer('AI_TIMEOUT_MS', 30000, 120000),
  });
}
