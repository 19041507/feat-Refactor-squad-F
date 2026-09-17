import { test, expect } from '@playwright/test';

test('home usa identidade escura com assinatura visual do Squad F', async ({ page }) => {
  await page.goto('/index.html');

  const heroTitle = page.locator('.hero-text h1');
  const primaryButton = page.getByRole('link', { name: /Explore os projetos/ });
  const teamPanel = page.locator('.team-members');
  const brandSymbol = page.locator('.brand-mark svg');

  await expect(heroTitle).toBeVisible();
  const titleSize = await heroTitle.evaluate((element) =>
    parseFloat(getComputedStyle(element).fontSize),
  );
  expect(titleSize).toBeGreaterThanOrEqual(page.viewportSize().width < 600 ? 36 : 42);
  expect(titleSize).toBeLessThanOrEqual(58);
  await expect(primaryButton).toHaveCSS('background-color', 'rgb(202, 255, 51)');
  await expect(teamPanel).toHaveCSS('background-color', 'rgb(10, 10, 10)');
  await expect(brandSymbol).toBeVisible();
});

test('título principal entra palavra por palavra e termina totalmente nítido', async ({ page }) => {
  await page.goto('/index.html');

  const title = page.locator('.hero-text h1');
  const words = title.locator('.blur-text-word');
  await expect(title).toContainText('Ideias em equipe.');
  await expect(title).toContainText('Código com propósito.');
  await expect(words).toHaveCount(6);
  await expect(words.last()).toHaveCSS('opacity', '1');
  await expect(words.last()).toHaveCSS('filter', 'blur(0px)');
  await expect(words.first()).toHaveCSS('color', 'rgb(21, 21, 21)');
  await expect(title.locator('.hero-title-muted .blur-text-word').first()).toHaveCSS(
    'color',
    'rgb(95, 95, 95)',
  );
});

test('pagina sobre apresenta equipe compacta, colorida e aproveita a largura', async ({ page }) => {
  await page.goto('/pages/sobre.html');

  const main = page.locator('main');
  const heading = page.locator('.section-equipe h2');
  const firstPhoto = page.locator('.member-card img').first();
  const firstCard = page.locator('.member-card').first();

  await expect(heading).toHaveText('Conheça o Squad F');
  await expect(firstPhoto).toHaveCSS('filter', 'none');
  await expect(firstCard).toHaveCSS('border-top-color', 'rgb(202, 255, 51)');

  if (page.viewportSize().width >= 1200) {
    const mainWidth = await main.evaluate((element) => element.getBoundingClientRect().width);
    expect(mainWidth).toBeGreaterThan(1250);
  }
});

test('chat mantém a identidade visual do portfolio', async ({ page }) => {
  await page.goto('/pages/chat.html');

  const sidebar = page.locator('.chat-sidebar');
  const panel = page.locator('.chat-panel');
  const suggestion = page.locator('.suggestions button').first();
  const input = page.getByLabel('Sua mensagem');
  const submit = page.getByRole('button', { name: 'Enviar mensagem', exact: true });

  await expect(sidebar).toHaveCSS('background-color', 'rgb(10, 10, 10)');
  await expect(panel).toHaveCSS('border-radius', '16px');
  await expect(suggestion).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(input).toHaveCSS('border-radius', '12px');
  await expect(submit).toHaveCSS('background-color', 'rgb(202, 255, 51)');
});

test('cursor luminoso acompanha o mouse sem bloquear a interface', async ({ page }) => {
  test.skip(page.viewportSize().width < 800, 'Efeito exclusivo para telas com mouse.');
  await page.goto('/index.html');

  const glow = page.locator('.glow-cursor');
  await expect(glow).toBeVisible();
  await expect(glow).toHaveAttribute('aria-hidden', 'true');
  await expect(glow).toHaveCSS('pointer-events', 'none');

  await page.mouse.move(240, 180);
  await expect(glow).toHaveClass(/is-active/);
});

test('cursor luminoso respeita preferência por menos movimento', async ({ page }) => {
  test.skip(page.viewportSize().width < 800, 'Efeito exclusivo para telas com mouse.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/index.html');

  await expect(page.locator('.glow-cursor')).toHaveCount(0);
});

test('cursor luminoso funciona em notebook com tela de toque e mouse', async ({ page }) => {
  test.skip(page.viewportSize().width < 800, 'Efeito exclusivo para telas com mouse.');
  await page.addInitScript(() => {
    const nativeMatchMedia = window.matchMedia.bind(window);
    window.matchMedia = (query) => {
      if (query === '(pointer: coarse)') return { matches: true };
      if (query === '(any-pointer: fine)') return { matches: true };
      return nativeMatchMedia(query);
    };
  });
  await page.goto('/index.html');

  await expect(page.locator('.glow-cursor')).toBeAttached();
});
