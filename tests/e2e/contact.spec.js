import { test, expect } from '@playwright/test';

test('contato valida os campos e prepara texto sem enviar para endereço fictício', async ({ page }) => {
  await page.goto('/pages/contato.html');
  await page.getByRole('button', { name: 'Preparar mensagem' }).click();
  await expect(page.locator('#contact-preview')).toBeHidden();
  await page.getByLabel(/^Nome completo$/i).fill('Daniel');
  await page.getByLabel('E-mail', { exact: true }).fill('daniel@example.com');
  await page.getByLabel('Mensagem', { exact: true }).fill('Gostaria de conversar sobre um projeto.');
  await page.getByRole('button', { name: 'Preparar mensagem' }).click();
  await expect(page.getByLabel('Mensagem pronta para copiar')).toHaveValue(
    'Nome: Daniel\nE-mail: daniel@example.com\n\nGostaria de conversar sobre um projeto.');
  await expect(page.getByRole('status')).toContainText('Nenhuma mensagem foi enviada');
});
