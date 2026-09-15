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
  const integer = (name, fallback, max) => {
    const value = Number(env[name] || fallback);
    if (!Number.isInteger(value) || value < 1 || value > max) {
      throw new Error(`${name} deve ser um inteiro entre 1 e ${max}.`);
    }
    return value;
  };
  return Object.freeze({
    port: integer('PORT', 3000, 65535),
    host: env.HOST?.trim() || '127.0.0.1',
    apiKey: env.OPENAI_API_KEY?.trim() || '',
    model: env.OPENAI_MODEL?.trim() || 'gpt-4.1-mini',
    timeoutMs: integer('AI_TIMEOUT_MS', 30000, 120000),
  });
}
