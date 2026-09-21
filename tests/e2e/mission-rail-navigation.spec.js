const { test, expect } = require('@playwright/test');

async function openReadyApp(page) {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('/index.html', { waitUntil: 'load' });
  await expect(page.locator('.evo-rail-feedback')).toHaveCount(1);
}

function railItem(page, href) {
  return page.locator('.evo-rail-item[href="' + href + '"]');
}

async function expectActive(page, href, feedback) {
  const active = railItem(page, href);
  await expect(active).toHaveClass(/\bactive\b/);
  await expect(active).toHaveAttribute('aria-current', 'location');
  await expect(page.locator('.evo-rail-item.active')).toHaveCount(1);
  await expect(page.locator('.evo-rail-feedback')).toContainText(feedback);
}

test('PR20 torna Operação, Mapa, Quadro, Eventos e Base funcionalmente navegáveis', async ({ page }) => {
  await openReadyApp(page);

  await expectActive(page, '#workspaceCard', 'Operação');

  await railItem(page, '#dropZone').click();
  await expectActive(page, '#dropZone', 'Mapa');
  await expect(page.locator('#dropZone')).toHaveClass(/evo-rail-target-pulse/);
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('dropZone');

  await railItem(page, '#fieldsGrid').click();
  await expectActive(page, '#fieldsGrid', 'Quadro');
  await expect(page.locator('.tab[data-tab="data"]')).toHaveClass(/\bactive\b/);
  await expect(page.locator('[data-panel="data"]')).toHaveClass(/\bactive\b/);
  await expect(page.locator('[data-panel="timeline"]')).not.toHaveClass(/\bactive\b/);
  await expect.poll(() => page.evaluate(() => document.activeElement?.getAttribute('data-panel'))).toBe('data');

  await railItem(page, '#timelineList').click();
  await expectActive(page, '#timelineList', 'Eventos');
  await expect(page.locator('.tab[data-tab="timeline"]')).toHaveClass(/\bactive\b/);
  await expect(page.locator('[data-panel="timeline"]')).toHaveClass(/\bactive\b/);
  await expect(page.locator('[data-panel="data"]')).not.toHaveClass(/\bactive\b/);
  await expect.poll(() => page.evaluate(() => document.activeElement?.getAttribute('data-panel'))).toBe('timeline');

  await railItem(page, '#knowledgeBaseBtn').click();
  await expectActive(page, '#knowledgeBaseBtn', 'Base');
  await expect(page.locator('#knowledgeBrowserModal')).toBeVisible();
  await expect(page.locator('#knowledgeBrowserModal .knowledge-browser-card')).toBeVisible();

  await page.locator('#knowledgeBrowserModal .modal-footer button[value="cancel"]').click();
  await expect(page.locator('#knowledgeBrowserModal')).toBeHidden();
  await expectActive(page, '#timelineList', 'Eventos');

  await railItem(page, '#workspaceCard').click();
  await expectActive(page, '#workspaceCard', 'Operação');
  await expect(page.locator('#workspaceCard')).toHaveClass(/evo-rail-target-pulse/);
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('workspaceCard');
});

test('PR20 preserva teclado e sincroniza o rail quando o inspector muda de aba', async ({ page }) => {
  await openReadyApp(page);

  const board = railItem(page, '#fieldsGrid');
  await board.focus();
  await page.keyboard.press('Enter');
  await expectActive(page, '#fieldsGrid', 'Quadro');
  await expect(page.locator('[data-panel="data"]')).toHaveClass(/\bactive\b/);

  await page.locator('.tab[data-tab="timeline"]').click();
  await expect(page.locator('[data-panel="timeline"]')).toHaveClass(/\bactive\b/);
  await expectActive(page, '#timelineList', 'Eventos');

  await page.locator('.tab[data-tab="data"]').click();
  await expect(page.locator('[data-panel="data"]')).toHaveClass(/\bactive\b/);
  await expectActive(page, '#fieldsGrid', 'Quadro');
});
