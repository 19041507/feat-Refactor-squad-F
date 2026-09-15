import { test, expect } from '@playwright/test';

test('envia, mantém contexto e limpa conversa sem executar HTML', async ({ page }) => {
  const requests = [];
  await page.route('**/api/chat', async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({ json: { reply: '<img src=x onerror=alert(1)> Use src/ e tests/.' } });
  });
  await page.goto('/pages/chat.html');
  const input = page.getByLabel('Sua mensagem');
  await input.fill('Como organizar código?');
  await page.getByRole('button', { name: 'Enviar mensagem', exact: true }).click();
  await expect(page.getByRole('log')).toContainText('Use src/ e tests/.');
  await expect(page.getByRole('log').locator('img')).toHaveCount(0);
  await input.fill('E os testes?');
  await input.press('Enter');
  await expect(page.getByRole('status')).toHaveText('Resposta recebida.');
  expect(requests[1].history).toHaveLength(2);
  expect(requests[1].history[0]).toEqual({ role: 'user', content: 'Como organizar código?' });
  await page.getByRole('button', { name: 'Nova conversa' }).click();
  await expect(page.getByRole('log').locator('article')).toHaveCount(0);
  await expect(input).toBeFocused();
  await input.fill('Recomeçar');
  await input.press('Enter');
  await expect(page.getByRole('status')).toHaveText('Resposta recebida.');
  expect(requests[2].history).toEqual([]);
});

test('falha mantém rascunho e permite tentar novamente sem duplicar histórico', async ({
  page,
}) => {
  let count = 0;
  await page.route('**/api/chat', async (route) => {
    count++;
    await route.fulfill(
      count === 1
        ? { status: 502, json: { error: 'Tente novamente.' } }
        : { json: { reply: 'Agora funcionou.' } },
    );
  });
  await page.goto('/pages/chat.html');
  const input = page.getByLabel('Sua mensagem');
  await input.fill('Olá');
  await input.press('Enter');
  await expect(page.getByRole('alert')).toHaveText('Tente novamente.');
  await expect(input).toHaveValue('Olá');
  await input.press('Enter');
  await expect(page.getByRole('log').locator('article')).toHaveCount(2);
  await expect(page.getByRole('log')).toContainText('Agora funcionou.');
});

test('bloqueia envio duplo durante carregamento e aceita quebra de linha', async ({ page }) => {
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  await page.route('**/api/chat', async (route) => {
    await gate;
    await route.fulfill({ json: { reply: 'Olá!' } });
  });
  await page.goto('/pages/chat.html');
  const input = page.getByLabel('Sua mensagem');
  await input.fill('Linha um');
  await input.press('Shift+Enter');
  await input.press('a');
  await expect(input).toHaveValue('Linha um\na');
  await page.getByRole('button', { name: 'Enviar mensagem', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Enviando…' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Nova conversa' })).toBeDisabled();
  release();
  await expect(page.getByRole('status')).toHaveText('Resposta recebida.');
});

test('sem chave exibe falha real do backend e não simula resposta', async ({ page }) => {
  await page.goto('/pages/chat.html');
  await page.getByLabel('Sua mensagem').fill('Olá');
  await page.getByRole('button', { name: 'Enviar mensagem', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('não está disponível');
  await expect(page.getByRole('log').locator('article')).toHaveCount(0);
});
