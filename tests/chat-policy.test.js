import test from 'node:test';
import assert from 'node:assert/strict';
import { planReply, buildInstructions } from '../src/backend/services/chat-policy.js';

const config = {
  model: 'standard',
  fastModel: 'fast',
  simpleTokens: 160,
  briefTokens: 360,
  detailedTokens: 800,
  contextChars: 6000,
};
const ask = (content) => [{ role: 'user', content }];

test('saudação e definição simples usam modelo econômico; código exige modelo principal', () => {
  for (const message of ['Oi!', 'Valeu', 'O que é HTML?', 'O que é refatoração?']) {
    assert.equal(planReply(ask(message), config).models[0], 'fast');
    assert.equal(planReply(ask(message), config).maxTokens, 160);
  }
  for (const message of [
    'Corrija meu código',
    'Oi, implemente autenticação',
    'Compare SQL e NoSQL',
  ]) {
    assert.equal(planReply(ask(message), config).models[0], 'standard');
  }
});

test('detalhamento explícito aumenta orçamento sem desperdiçar classificador externo', () => {
  assert.equal(planReply(ask('O que é HTML?'), config, 'detailed').maxTokens, 800);
  assert.equal(planReply(ask('Explique passo a passo o CSS'), config).maxTokens, 800);
  assert.equal(planReply(ask('Como organizar meu projeto?'), config).maxTokens, 360);
});

test('contexto tem orçamento e preserva pergunta atual e turno mais recente', () => {
  const old = Array.from({ length: 10 }, (_, i) => ({
    role: i % 2 ? 'assistant' : 'user',
    content: String(i) + 'x'.repeat(i % 2 ? 9999 : 1999),
  }));
  const latest = { role: 'user', content: 'Explique melhor esse último exemplo' };
  const plan = planReply([...old, latest], config);
  assert.deepEqual(plan.input.at(-1), latest);
  assert.equal(plan.models[0], 'standard');
  assert.equal(plan.input.at(-2).role, 'assistant');
  assert.ok(plan.input.at(-2).content.startsWith('9'));
  assert.ok(plan.input.reduce((sum, item) => sum + item.content.length, 0) <= 6000);
  assert.equal(plan.input.length % 2, 1);
});

test('fallback não repete o mesmo modelo e respeita alternativa configurada', () => {
  assert.deepEqual(planReply(ask('Oi'), { ...config, model: 'same', fastModel: 'same' }).models, [
    'same',
  ]);
  assert.deepEqual(planReply(ask('Oi'), { ...config, fallbackModel: 'backup' }).models, [
    'fast',
    'backup',
  ]);
});

test('pedido explícito de concisão prevalece sobre palavra detalhes e preferência detalhada', () => {
  for (const message of [
    'Explique CSS sem detalhes',
    'Não detalhe; responda em uma frase',
    'Resuma os detalhes em uma frase',
  ]) {
    for (const preference of ['brief', 'detailed']) {
      assert.equal(planReply(ask(message), config, preference).detail, 'brief');
      assert.equal(planReply(ask(message), config, preference).maxTokens, 360);
    }
  }
});

test('perguntas diretas do portfólio usam modelo econômico', () => {
  for (const question of [
    'Quem é o Squad F?',
    'Quem faz parte da equipe?',
    'Quem é Daniel Augusto?',
    'Quais serviços vocês oferecem?',
  ]) {
    assert.equal(planReply(ask(question), config).models[0], 'fast');
  }
});
test('instruções apresentam equipe e delimitam atuação ao portfólio', () => {
  const instructions = buildInstructions('brief');
  for (const name of ['Daniel Augusto', 'Edson', 'Felipe', 'Elisson'])
    assert.ok(instructions.includes(name));
  assert.match(instructions, /Não escreva código/);
  assert.match(instructions, /formulário.*não envia/s);
  assert.doesNotMatch(instructions, /Ajude com dúvidas gerais/);
});
