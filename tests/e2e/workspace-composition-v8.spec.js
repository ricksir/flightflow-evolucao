const { test, expect } = require('@playwright/test');

test('Workspace Composition V8 mantém mapa dominante no desktop amplo', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('/index.html', { waitUntil: 'load' });

  const metrics = await page.evaluate(() => {
    const app = document.querySelector('.app');
    const rail = document.querySelector('.evo-rail');
    const content = document.querySelector('.content');
    const workspace = document.querySelector('.workspace-card');
    const inspector = document.querySelector('.inspector-card');
    const scene = document.querySelector('.scene-wrap');

    const a = app.getBoundingClientRect();
    const r = rail.getBoundingClientRect();
    const c = content.getBoundingClientRect();
    const w = workspace.getBoundingClientRect();
    const i = inspector.getBoundingClientRect();
    const s = scene.getBoundingClientRect();

    return {
      appDisplay: getComputedStyle(app).display,
      railWidth: r.width,
      contentGap: parseFloat(getComputedStyle(content).columnGap),
      workspaceWidth: w.width,
      inspectorWidth: i.width,
      topDelta: Math.abs(w.top - i.top),
      bottomDelta: Math.abs(w.bottom - i.bottom),
      sceneInsetLeft: s.left - w.left,
      sceneInsetRight: w.right - s.right,
      contentWithinApp: c.right <= a.right + 1,
    };
  });

  expect(metrics.appDisplay).toBe('grid');
  expect(metrics.railWidth).toBeGreaterThanOrEqual(80);
  expect(metrics.railWidth).toBeLessThanOrEqual(90);
  expect(metrics.contentGap).toBeLessThanOrEqual(8.5);
  expect(metrics.inspectorWidth).toBeGreaterThanOrEqual(350);
  expect(metrics.inspectorWidth).toBeLessThanOrEqual(422);
  expect(metrics.workspaceWidth).toBeGreaterThan(metrics.inspectorWidth * 2);
  expect(metrics.topDelta).toBeLessThanOrEqual(1);
  expect(metrics.bottomDelta).toBeLessThanOrEqual(2);
  expect(metrics.sceneInsetLeft).toBeLessThanOrEqual(10);
  expect(metrics.sceneInsetRight).toBeLessThanOrEqual(10);
  expect(metrics.contentWithinApp).toBe(true);
});

test('Workspace Composition V8 reduz o quadro entre 901 e 1180px', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 820 });
  await page.goto('/index.html', { waitUntil: 'load' });

  const metrics = await page.evaluate(() => {
    const content = document.querySelector('.content');
    const workspace = document.querySelector('.workspace-card');
    const inspector = document.querySelector('.inspector-card');
    return {
      columns: getComputedStyle(content).gridTemplateColumns,
      workspaceWidth: workspace.getBoundingClientRect().width,
      inspectorWidth: inspector.getBoundingClientRect().width,
    };
  });

  expect(metrics.inspectorWidth).toBeGreaterThanOrEqual(330);
  expect(metrics.inspectorWidth).toBeLessThanOrEqual(342);
  expect(metrics.workspaceWidth).toBeGreaterThan(metrics.inspectorWidth);
  expect(metrics.columns.split(' ').length).toBeGreaterThanOrEqual(2);
});
