import { test, expect } from '@playwright/test';

test('home usa identidade monocromatica com tipografia controlada', async ({ page }) => {
  await page.goto('/index.html');

  const heroTitle = page.locator('.hero-text h1');
  const primaryButton = page.getByRole('link', { name: /Explore os projetos/ });
  const teamPanel = page.locator('.team-members');

  await expect(heroTitle).toBeVisible();
  const titleSize = await heroTitle.evaluate((element) =>
    parseFloat(getComputedStyle(element).fontSize),
  );
  expect(titleSize).toBeGreaterThanOrEqual(42);
  expect(titleSize).toBeLessThanOrEqual(58);
  await expect(primaryButton).toHaveCSS('background-color', 'rgb(10, 10, 10)');
  await expect(teamPanel).toHaveCSS('background-color', 'rgb(17, 17, 17)');
  await expect(teamPanel).toHaveCSS('border-radius', '8px');
});

test('chat tem painel profissional em preto e branco', async ({ page }) => {
  await page.goto('/pages/chat.html');

  const sidebar = page.locator('.chat-sidebar');
  const panel = page.locator('.chat-panel');
  const suggestion = page.locator('.suggestions button').first();
  const input = page.getByLabel('Sua mensagem');
  const submit = page.getByRole('button', { name: 'Enviar mensagem', exact: true });

  await expect(sidebar).toHaveCSS('background-color', 'rgb(17, 17, 17)');
  await expect(panel).toHaveCSS('border-radius', '8px');
  await expect(suggestion).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(input).toHaveCSS('border-radius', '8px');
  await expect(submit).toHaveCSS('background-color', 'rgb(10, 10, 10)');
});
