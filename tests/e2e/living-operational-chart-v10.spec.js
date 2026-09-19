const { test, expect } = require('@playwright/test');

test('Living Operational Chart V10 torna a carta central técnica e compacta', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('/index.html', { waitUntil: 'load' });
  await page.locator('.scene-wrap').waitFor({ state: 'attached' });
  await page.locator('.real-map-control-group').first().waitFor({ state: 'attached' });
  await page.locator('.real-map-layer-switches').waitFor({ state: 'attached' });

  const metrics = await page.evaluate(() => {
    const workspace = document.querySelector('.workspace-card');
    const scene = document.querySelector('.scene-wrap');
    const control = document.querySelector('.real-map-control-group');
    const button = document.querySelector('.real-map-control-group button');
    const caption = document.querySelector('.scene-caption');
    const layers = document.querySelector('.real-map-layer-switches');

    const ws = workspace.getBoundingClientRect();
    const sc = scene.getBoundingClientRect();

    return {
      sceneRadius: getComputedStyle(scene).borderRadius,
      sceneBorder: getComputedStyle(scene).borderTopStyle,
      sceneInsetLeft: sc.left - ws.left,
      controlRadius: control ? getComputedStyle(control).borderRadius : null,
      buttonHeight: button ? button.getBoundingClientRect().height : null,
      captionRadius: caption ? getComputedStyle(caption).borderRadius : null,
      layersHeight: layers ? layers.getBoundingClientRect().height : null,
      layersRadius: layers ? getComputedStyle(layers).borderRadius : null,
    };
  });

  expect(metrics.sceneRadius).toBe('9px');
  expect(metrics.sceneBorder).toBe('solid');
  expect(metrics.sceneInsetLeft).toBeLessThanOrEqual(2);
  expect(metrics.controlRadius).toBe('5px');
  expect(metrics.buttonHeight).toBe(32);
  expect(metrics.captionRadius).toBe('6px');
  expect(metrics.layersHeight).toBeGreaterThanOrEqual(32);
  expect(metrics.layersRadius).toBe('5px');
});

test('Living Operational Chart V10 mantém superfície cartográfica clara no tema light', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('/index.html', { waitUntil: 'load' });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));

  const metrics = await page.evaluate(() => {
    const root = document.documentElement;
    const scene = document.querySelector('.scene-wrap');
    return {
      surface: getComputedStyle(scene).backgroundColor,
      accentDefault: getComputedStyle(root).getPropertyValue('--evo-chart-accent').trim(),
    };
  });

  expect(metrics.surface).toBe('rgb(244, 248, 248)');
  expect(metrics.accentDefault).toBe('#43bfdc');

  await page.evaluate(() => document.documentElement.setAttribute('data-palette', 'velox'));
  const veloxAccent = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--evo-chart-accent').trim()
  );
  expect(veloxAccent).toBe('#49e7ad');
});
