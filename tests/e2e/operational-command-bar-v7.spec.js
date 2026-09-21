const { test, expect } = require('@playwright/test');

function number(value) {
  return Number.parseFloat(String(value || '0')) || 0;
}

test('Operational Command Bar V7 organiza o header em zonas técnicas sem substituir controles', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'load' });

  const result = await page.evaluate(() => {
    const style = selector => getComputedStyle(document.querySelector(selector));
    const root = getComputedStyle(document.documentElement);
    return {
      surface: root.getPropertyValue('--evo-command-surface').trim(),
      topbarBackground: style('.topbar').backgroundImage,
      topbarRadius: style('.topbar').borderRadius,
      fileRadius: style('.file-actions').borderRadius,
      actionsRadius: style('.header-actions').borderRadius,
      commandRadius: style('#configBtn').borderRadius,
      brandMarkRadius: style('.brand-mark').borderRadius,
      selectedFileSize: parseFloat(style('#selectedFileLabel').fontSize),
      fileCount: document.querySelectorAll('#fileInput').length,
      chooseCount: document.querySelectorAll('#chooseFileBtn').length,
      startCount: document.querySelectorAll('#readStartBtn').length,
      demoCount: document.querySelectorAll('#demoBtn').length,
      configCount: document.querySelectorAll('#configBtn').length,
    };
  });

  expect(result.surface).toBe('#071722');
  expect(result.topbarBackground).toContain('linear-gradient');
  expect(number(result.topbarRadius)).toBeGreaterThanOrEqual(14);
  expect(result.topbarRadius).toBe('16px');
  expect(result.fileRadius).toBe('0px');
  expect(result.actionsRadius).toBe('0px');
  expect(result.commandRadius).toBe('4px');
  expect(result.brandMarkRadius).toBe('8px');
  expect(result.selectedFileSize).toBeGreaterThanOrEqual(10);
  expect(result.fileCount).toBe(1);
  expect(result.chooseCount).toBe(1);
  expect(result.startCount).toBe(1);
  expect(result.demoCount).toBe(1);
  expect(result.configCount).toBe(1);
});

test('Operational Command Bar V7 harmoniza com o tema claro e preserva foco, dark e Velox', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'load' });

  const setMode = mode => page.evaluate(({ theme, palette }) => {
    document.documentElement.dataset.theme = theme;
    if (palette) document.documentElement.dataset.palette = palette;
    else delete document.documentElement.dataset.palette;
  }, mode);

  const readVisual = () => page.evaluate(() => {
    const topbar = getComputedStyle(document.querySelector('.topbar'));
    const config = getComputedStyle(document.querySelector('#configBtn'));
    const brand = getComputedStyle(document.querySelector('.brand-title'));
    return {
      backgroundColor: topbar.backgroundColor,
      backgroundImage: topbar.backgroundImage,
      radius: topbar.borderRadius,
      brandColor: brand.color,
      focusStyle: config.outlineStyle,
      focusWidth: parseFloat(config.outlineWidth),
    };
  });

  await setMode({ theme: 'light', palette: '' });
  await page.locator('#configBtn').focus();
  await expect(page.locator('#configBtn')).toBeFocused();
  const light = await readVisual();
  expect(light.backgroundColor).toBe('rgb(245, 250, 252)');
  expect(light.backgroundImage).toContain('linear-gradient');
  expect(light.radius).toBe('16px');
  expect(light.brandColor).toBe('rgb(16, 47, 61)');
  expect(light.focusStyle).not.toBe('none');
  expect(light.focusWidth).toBeGreaterThanOrEqual(2);

  await setMode({ theme: 'dark', palette: '' });
  const dark = await readVisual();
  expect(dark.backgroundColor).not.toBe(light.backgroundColor);
  expect(dark.brandColor).not.toBe(light.brandColor);

  await setMode({ theme: 'light', palette: 'velox' });
  const velox = await readVisual();
  expect(velox.backgroundColor).not.toBe(light.backgroundColor);
  expect(velox.brandColor).not.toBe(light.brandColor);
});

test('Operational Command Bar V7 quebra a fonte do plano para segunda linha em largura intermediária', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 900 });
  await page.goto('/index.html', { waitUntil: 'load' });

  const layout = await page.evaluate(() => {
    const topbar = document.querySelector('.topbar').getBoundingClientRect();
    const brand = document.querySelector('.brand').getBoundingClientRect();
    const file = document.querySelector('.file-actions').getBoundingClientRect();
    return {
      topbarHeight: topbar.height,
      brandBottom: brand.bottom,
      fileTop: file.top,
      fileWidth: file.width,
      topbarWidth: topbar.width,
    };
  });

  expect(layout.fileTop).toBeGreaterThanOrEqual(layout.brandBottom - 2);
  expect(layout.fileWidth).toBeGreaterThan(layout.topbarWidth * 0.8);
  expect(layout.topbarHeight).toBeGreaterThan(64);
});
