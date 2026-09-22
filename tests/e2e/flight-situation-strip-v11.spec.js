const { test, expect } = require('@playwright/test');

test('Flight Situation Strip V11 organiza rota e estado em faixa técnica no desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('/index.html', { waitUntil: 'load' });
  await page.locator('.scene-head').waitFor({ state: 'attached' });
  await page.locator('.scene-status').waitFor({ state: 'attached' });

  const metrics = await page.evaluate(() => {
    const head = document.querySelector('.scene-head');
    const route = document.querySelector('.route-airports');
    const status = document.querySelector('.scene-status');
    const badge = document.querySelector('.status-badge, .stage-badge, .frame-counter, .scene-protocol-toggle');
    const hs = getComputedStyle(head);
    const rs = route ? getComputedStyle(route) : null;
    const ss = getComputedStyle(status);
    const bs = badge ? getComputedStyle(badge) : null;

    return {
      headDisplay: hs.display,
      headColumns: hs.gridTemplateColumns,
      headHeight: head.getBoundingClientRect().height,
      routeFont: rs?.fontFamily || '',
      routeNumeric: rs?.fontVariantNumeric || '',
      statusRadius: ss.borderRadius,
      statusBorderLeft: parseFloat(ss.borderLeftWidth),
      badgeHeight: badge?.getBoundingClientRect().height || 0,
      badgeRadius: bs?.borderRadius || '',
      badgeFont: parseFloat(bs?.fontSize || '0'),
    };
  });

  expect(metrics.headDisplay).toBe('grid');
  expect(metrics.headColumns.split(' ').length).toBeGreaterThanOrEqual(2);
  expect(metrics.headHeight).toBeGreaterThanOrEqual(48);
  expect(metrics.headHeight).toBeLessThanOrEqual(52);
  expect(metrics.routeFont.toLowerCase()).toContain('monospace');
  expect(metrics.routeNumeric).toContain('tabular-nums');
  expect(metrics.statusRadius).toBe('0px');
  expect(metrics.statusBorderLeft).toBeGreaterThanOrEqual(1);
  expect(metrics.badgeHeight).toBe(26);
  expect(metrics.badgeRadius).toBe('4px');
  expect(metrics.badgeFont).toBeGreaterThanOrEqual(10);
});

test('Flight Situation Strip V11 quebra o estado em segunda linha entre 901 e 1180px', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 820 });
  await page.goto('/index.html', { waitUntil: 'load' });

  const metrics = await page.evaluate(() => {
    const head = document.querySelector('.scene-head');
    const status = document.querySelector('.scene-status');
    const hs = getComputedStyle(head);
    const ss = getComputedStyle(status);
    return {
      columns: hs.gridTemplateColumns,
      borderLeft: parseFloat(ss.borderLeftWidth),
      statusMarginLeft: ss.marginLeft,
      statusWidth: status.getBoundingClientRect().width,
      headWidth: head.getBoundingClientRect().width,
    };
  });

  expect(metrics.columns.split(' ').length).toBe(1);
  expect(metrics.borderLeft).toBe(0);
  expect(parseFloat(metrics.statusMarginLeft)).toBe(0);
  expect(metrics.statusWidth).toBeLessThan(metrics.headWidth);
});
