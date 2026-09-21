const { test, expect } = require('@playwright/test');

function rgb(value) {
  const match = String(value || '').match(/rgba?\(([^)]+)\)/);
  if (!match) return [0, 0, 0];
  return match[1].split(',').slice(0, 3).map(Number);
}

function distance(a, b) {
  return Math.sqrt(a.reduce((sum, value, index) => sum + Math.pow(value - b[index], 2), 0));
}

async function readChrome(page) {
  return page.evaluate(() => {
    const style = selector => getComputedStyle(document.querySelector(selector));
    const root = getComputedStyle(document.documentElement);
    return {
      theme: document.documentElement.dataset.theme || '',
      palette: document.documentElement.dataset.palette || '',
      accent: root.getPropertyValue('--ffds-accent').trim(),
      dep: root.getPropertyValue('--evo-dep').trim(),
      trf: root.getPropertyValue('--evo-trf').trim(),
      ter: root.getPropertyValue('--evo-ter').trim(),
      bodyImage: getComputedStyle(document.body).backgroundImage,
      topbar: style('.topbar').backgroundColor,
      workspace: style('.workspace-card').backgroundColor,
      inspector: style('.inspector-card').backgroundColor,
      transport: style('.transport').backgroundColor,
      rail: style('.evo-rail').backgroundColor,
      tabs: style('.inspector-tabs').backgroundColor,
      topbarImage: style('.topbar').backgroundImage,
      transportImage: style('.transport').backgroundImage,
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: innerWidth,
    };
  });
}

test('PR22 torna Velox claramente distinto do tema escuro sem mudar semântica ATS', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('/index.html', { waitUntil: 'load' });

  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'dark';
    delete document.documentElement.dataset.palette;
  });
  const dark = await readChrome(page);

  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'dark';
    document.documentElement.dataset.palette = 'velox';
  });
  const velox = await readChrome(page);

  expect(dark.palette).toBe('');
  expect(velox.palette).toBe('velox');
  expect(velox.accent).toBe('#58efba');
  expect(velox.accent).not.toBe(dark.accent);

  const differences = [
    distance(rgb(dark.topbar), rgb(velox.topbar)),
    distance(rgb(dark.workspace), rgb(velox.workspace)),
    distance(rgb(dark.inspector), rgb(velox.inspector)),
    distance(rgb(dark.transport), rgb(velox.transport)),
    distance(rgb(dark.rail), rgb(velox.rail)),
    distance(rgb(dark.tabs), rgb(velox.tabs)),
  ];

  expect(differences.filter(value => value >= 12).length).toBeGreaterThanOrEqual(5);
  expect(differences.reduce((sum, value) => sum + value, 0) / differences.length).toBeGreaterThanOrEqual(20);
  expect(velox.bodyImage).not.toBe(dark.bodyImage);
  expect(velox.topbarImage).not.toBe(dark.topbarImage);
  expect(velox.transportImage).not.toBe(dark.transportImage);

  expect(velox.dep).toBe(dark.dep);
  expect(velox.trf).toBe(dark.trf);
  expect(velox.ter).toBe(dark.ter);
  expect(velox.scrollWidth).toBeLessThanOrEqual(velox.viewportWidth + 1);
});

test('PR22 continua selecionável como Dashboard moderno e persiste após reload', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'load' });
  await page.locator('#configBtn').click();
  await expect(page.locator('#themeVeloxBtn')).toBeVisible();
  await page.locator('#themeVeloxBtn').click();

  await expect.poll(() => page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    palette: document.documentElement.dataset.palette,
    saved: JSON.parse(localStorage.getItem('flightflow-config-v2') || '{}').theme,
  }))).toEqual({ theme:'dark', palette:'velox', saved:'velox' });

  const visual = await readChrome(page);
  expect(visual.accent).toBe('#58efba');
  expect(rgb(visual.topbar)).not.toEqual([0, 0, 0]);

  await page.reload({ waitUntil: 'load' });
  await expect.poll(() => page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    palette: document.documentElement.dataset.palette,
  }))).toEqual({ theme:'dark', palette:'velox' });
});
