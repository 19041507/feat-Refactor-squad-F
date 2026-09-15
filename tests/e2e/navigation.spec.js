import { test, expect } from '@playwright/test';

const pages = ['/', ...['sobre', 'projetos', 'habilidades', 'servicos', 'depoimentos',
  'case-de-sucesso', 'contato'].map(name => `/pages/${name}.html`)];

for (const route of pages) {
  test(`${route} carrega recursos e navega sem transbordar a tela`, async ({ page }) => {
    const failures = [];
    page.on('pageerror', error => failures.push(error.message));
    page.on('response', response => { if (response.status() >= 400) failures.push(response.url()); });
    await page.goto(route);
    await expect(page.locator('main h1')).toHaveCount(1);
    await expect(page.locator('footer')).toBeVisible();
    const menu = page.getByRole('button', { name: 'Abrir menu' });
    if (await menu.isVisible()) await menu.click();
    await expect(page.getByRole('navigation', { name: 'Principal' }).getByRole('link')).toHaveCount(9);
    const active = page.locator('nav [aria-current="page"]');
    await expect(active).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await page.locator('img').evaluateAll(images => images.every(img => img.complete && img.naturalWidth > 0))).toBe(true);
    await page.getByRole('link', { name: 'Sobre', exact: true }).click();
    await expect(page).toHaveURL(/\/pages\/sobre.html$/);
    expect(failures).toEqual([]);
  });
}

test('menu móvel fecha com Escape e devolve foco ao botão', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const menu = page.locator('button[aria-controls="main-nav"]');
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
});
