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

test('Mission Rail V9 harmoniza com o tema claro e mantém foco, dark e Velox', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('/index.html', { waitUntil: 'load' });

  const setMode = mode => page.evaluate(({ theme, palette }) => {
    document.documentElement.dataset.theme = theme;
    if (palette) document.documentElement.dataset.palette = palette;
    else delete document.documentElement.dataset.palette;
  }, mode);

  const readMetrics = () => page.evaluate(() => {
    const rail = document.querySelector('.evo-rail');
    const focused = document.activeElement;
    const style = getComputedStyle(rail);
    const focusShadow = focused ? getComputedStyle(focused).boxShadow : '';
    return {
      railBgColor: style.backgroundColor,
      railBgImage: style.backgroundImage,
      focusShadow,
      href: focused?.getAttribute('href'),
    };
  });

  await setMode({ theme: 'light', palette: '' });
  const second = page.locator('.evo-rail-item').nth(1);
  await second.focus();
  const light = await readMetrics();
  expect(light.railBgColor).toBe('rgb(231, 241, 244)');
  expect(light.railBgImage).toContain('linear-gradient');
  expect(light.focusShadow).not.toBe('none');
  expect(light.href).toBe('#dropZone');

  await setMode({ theme: 'dark', palette: '' });
  const dark = await readMetrics();
  expect(dark.railBgColor).not.toBe(light.railBgColor);

  await setMode({ theme: 'light', palette: 'velox' });
  const velox = await readMetrics();
  expect(velox.railBgColor).not.toBe(light.railBgColor);
});
