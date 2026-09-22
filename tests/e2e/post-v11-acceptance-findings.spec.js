const { test, expect } = require('@playwright/test');

function rgbParts(value) {
  const match = String(value || '').match(/rgba?\(([^)]+)\)/);
  if (!match) return [0, 0, 0];
  return match[1].split(',').slice(0, 3).map(Number);
}

function relativeLuminance(rgb) {
  const values = rgb.map(value => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
}

function contrastRatio(foreground, background) {
  const a = relativeLuminance(rgbParts(foreground));
  const b = relativeLuminance(rgbParts(background));
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

test('tema claro pós-V11 usa chrome claro, contraste legível e mais viewport útil', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('/index.html', { waitUntil: 'load' });
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'light';
    delete document.documentElement.dataset.palette;
  });

  const metrics = await page.evaluate(() => {
    const rect = selector => document.querySelector(selector)?.getBoundingClientRect() || null;
    const style = selector => {
      const node = document.querySelector(selector);
      return node ? getComputedStyle(node) : null;
    };
    const directText = Array.from(document.body.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE)
      .map(node => String(node.textContent || '').trim())
      .filter(Boolean);

    const topbar = rect('.topbar');
    const rail = rect('.evo-rail');
    const transport = rect('.transport');
    const content = rect('.content');
    const workspace = rect('.workspace-card');
    const inspector = rect('.inspector-card');

    return {
      directText,
      viewportWidth: innerWidth,
      viewportHeight: innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      railWidth: rail?.width || 0,
      topbarHeight: topbar?.height || 0,
      topbarTop: topbar?.top || 0,
      transportBottom: transport?.bottom || 0,
      contentGap: parseFloat(style('.content')?.columnGap || '0'),
      workspaceWidth: workspace?.width || 0,
      inspectorWidth: inspector?.width || 0,
      topbarBg: style('.topbar')?.backgroundColor || '',
      topbarText: style('.brand-title')?.color || '',
      railBg: style('.evo-rail')?.backgroundColor || '',
      railText: style('.evo-rail-item.active')?.color || '',
      transportBg: style('.transport')?.backgroundColor || '',
      transportText: style('#currentTimeLabel')?.color || '',
      captionBg: style('.scene-caption')?.backgroundColor || '',
      captionText: style('.scene-caption')?.color || '',
    };
  });

  expect(metrics.directText).not.toContain('\\n');
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  expect(metrics.railWidth).toBeGreaterThanOrEqual(79);
  expect(metrics.railWidth).toBeLessThanOrEqual(81);
  expect(metrics.topbarHeight).toBeLessThanOrEqual(62);
  expect(metrics.topbarTop).toBeLessThanOrEqual(5);
  expect(metrics.transportBottom).toBeGreaterThanOrEqual(metrics.viewportHeight - 5);
  expect(metrics.contentGap).toBeLessThanOrEqual(4.5);
  expect(metrics.workspaceWidth).toBeGreaterThan(metrics.inspectorWidth * 2);

  expect(relativeLuminance(rgbParts(metrics.topbarBg))).toBeGreaterThan(0.75);
  expect(relativeLuminance(rgbParts(metrics.railBg))).toBeGreaterThan(0.70);
  expect(relativeLuminance(rgbParts(metrics.transportBg))).toBeGreaterThan(0.75);
  expect(relativeLuminance(rgbParts(metrics.captionBg))).toBeGreaterThan(0.82);

  expect(contrastRatio(metrics.topbarText, metrics.topbarBg)).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(metrics.railText, metrics.railBg)).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(metrics.transportText, metrics.transportBg)).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(metrics.captionText, metrics.captionBg)).toBeGreaterThanOrEqual(4.5);
});

test('demonstração TAM3542 continua íntegra após compactação e correções visuais', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('/index.html', { waitUntil: 'load' });
  await expect.poll(() => page.evaluate(() => Boolean(window.FlightFlowRouteProcessedV7412 && window.__SAMPLE_HISTORY__))).toBe(true);

  const sample = await page.evaluate(async () => {
    const api = window.FlightFlowRouteProcessedV7412;
    await api.analyzeText(window.__SAMPLE_HISTORY__, 'TAM3542-acceptance-smoke.txt');
    const model = api.getModel();
    const snapshot = model.resolvedSnapshots.at(-1);
    const points = snapshot.points.map(point => point.ident);
    const timed = api.timedProgressLimit(snapshot);
    const playback = api.routePlaybackLimit(snapshot, 999);
    return {
      callsign: model.history.callsign,
      adep: model.history.adep,
      ades: model.history.ades,
      points,
      timed,
      playback,
      unresolved: snapshot.points.filter(point => !point.geo).map(point => point.ident),
    };
  });

  expect(sample.callsign).toBe('TAM3542');
  expect(sample.adep).toBe('SBBR');
  expect(sample.ades).toBe('SBGO');
  expect(sample.points[0]).toBe('SBBR');
  expect(sample.points.at(-1)).toBe('SBGO');
  expect(sample.points).toContain('UMSUB');
  expect(sample.points).toContain('SIREM');
  expect(sample.timed).toBeCloseTo(1, 6);
  expect(sample.playback).toBeCloseTo(1, 6);

  const layout = await page.evaluate(() => {
    const workspace = document.querySelector('.workspace-card').getBoundingClientRect();
    const inspector = document.querySelector('.inspector-card').getBoundingClientRect();
    const scene = document.querySelector('.scene-wrap').getBoundingClientRect();
    return {
      alignedTop: Math.abs(workspace.top - inspector.top),
      alignedBottom: Math.abs(workspace.bottom - inspector.bottom),
      sceneWidth: scene.width,
      workspaceWidth: workspace.width,
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: innerWidth,
    };
  });

  expect(layout.alignedTop).toBeLessThanOrEqual(1);
  expect(layout.alignedBottom).toBeLessThanOrEqual(2);
  expect(layout.sceneWidth).toBeGreaterThan(layout.workspaceWidth * 0.9);
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
});


test('PR39 reduz área morta superior sem comprimir controles em 1600x900', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('/index.html', { waitUntil: 'load' });

  const metrics = await page.evaluate(() => {
    const topbar = document.querySelector('.topbar');
    const sceneHead = document.querySelector('.scene-head');
    const dropZone = document.querySelector('#dropZone');
    const flightId = document.querySelector('.flight-id-block');
    const sceneStatus = document.querySelector('.scene-status');
    if (!topbar || !sceneHead || !dropZone || !flightId || !sceneStatus) {
      throw new Error('Estrutura superior operacional indisponível');
    }

    const topbarRect = topbar.getBoundingClientRect();
    const sceneHeadRect = sceneHead.getBoundingClientRect();
    const dropZoneRect = dropZone.getBoundingClientRect();
    const flightRect = flightId.getBoundingClientRect();
    const statusRect = sceneStatus.getBoundingClientRect();

    return {
      topbarHeight: topbarRect.height,
      sceneHeadHeight: sceneHeadRect.height,
      mapLeadIn: dropZoneRect.top - topbarRect.bottom,
      sceneHeadFits: sceneHead.scrollHeight <= sceneHead.clientHeight + 1,
      topbarFits: topbar.scrollHeight <= topbar.clientHeight + 1,
      flightInside: flightRect.top >= sceneHeadRect.top - 1 && flightRect.bottom <= sceneHeadRect.bottom + 1,
      statusInside: statusRect.top >= sceneHeadRect.top - 1 && statusRect.bottom <= sceneHeadRect.bottom + 1,
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: innerWidth,
    };
  });

  expect(metrics.topbarHeight).toBeLessThanOrEqual(53);
  expect(metrics.sceneHeadHeight).toBeLessThanOrEqual(52);
  expect(metrics.mapLeadIn).toBeLessThanOrEqual(56);
  expect(metrics.sceneHeadFits).toBe(true);
  expect(metrics.topbarFits).toBe(true);
  expect(metrics.flightInside).toBe(true);
  expect(metrics.statusInside).toBe(true);
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
});
