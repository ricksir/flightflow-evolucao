const { test, expect } = require('@playwright/test');

test('Mission Rail V9 mantém navegação compacta e active-state técnico no desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('/index.html', { waitUntil: 'load' });

  const metrics = await page.evaluate(() => {
    const rail = document.querySelector('.evo-rail');
    const active = document.querySelector('.evo-rail-item.active');
    const icon = active?.querySelector('.evo-rail-icon');
    const label = active?.querySelector('span:last-child');
    const phase = document.querySelector('.evo-rail-phase');
    const version = document.querySelector('.evo-rail-version');
    const railStyle = getComputedStyle(rail);
    const activeStyle = getComputedStyle(active);
    const markerStyle = getComputedStyle(active, '::before');

    return {
      railWidth: rail.getBoundingClientRect().width,
      railBackground: railStyle.backgroundImage,
      activeRadius: activeStyle.borderRadius,
      markerWidth: markerStyle.width,
      markerBackground: markerStyle.backgroundColor,
      iconWidth: icon.getBoundingClientRect().width,
      iconHeight: icon.getBoundingClientRect().height,
      labelSize: parseFloat(getComputedStyle(label).fontSize),
      phase: phase?.textContent?.trim(),
      version: version?.textContent?.trim(),
      anchors: Array.from(document.querySelectorAll('.evo-rail-item')).map(a => a.getAttribute('href')),
    };
  });

  expect(metrics.railWidth).toBeGreaterThanOrEqual(80);
  expect(metrics.railBackground).toContain('linear-gradient');
  expect(metrics.activeRadius).toBe('6px');
  expect(parseFloat(metrics.markerWidth)).toBeGreaterThanOrEqual(2);
  expect(metrics.markerBackground).not.toBe('rgba(0, 0, 0, 0)');
  expect(metrics.iconWidth).toBe(28);
  expect(metrics.iconHeight).toBe(28);
  expect(metrics.labelSize).toBeGreaterThanOrEqual(8);
  expect(metrics.phase).toBe('MISSION RAIL V9');
  expect(metrics.version).toBe('V9 · MISSÃO');
  expect(metrics.anchors).toEqual(['#workspaceCard','#dropZone','#fieldsGrid','#timelineList','#knowledgeBaseBtn']);
});

test('Mission Rail V9 continua escura no tema claro e mantém foco visível', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('/index.html', { waitUntil: 'load' });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));

  const second = page.locator('.evo-rail-item').nth(1);
  await second.focus();

  const metrics = await page.evaluate(() => {
    const rail = document.querySelector('.evo-rail');
    const focused = document.activeElement;
    const railBg = getComputedStyle(rail).backgroundImage;
    const focusShadow = focused ? getComputedStyle(focused).boxShadow : '';
    return { railBg, focusShadow, href: focused?.getAttribute('href') };
  });

  expect(metrics.railBg).toContain('linear-gradient');
  expect(metrics.focusShadow).not.toBe('none');
  expect(metrics.href).toBe('#dropZone');
});
