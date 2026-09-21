const { test, expect } = require('@playwright/test');

test('Temporal Deck V6 torna a timeline inferior dominante sem alterar o scrubber', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'load' });

  const overlayDemo = page.locator('#overlayDemoBtn');
  if (await overlayDemo.isVisible()) await overlayDemo.click();
  else await page.locator('#demoBtn').click();

  await expect(page.locator('#timelineList .timeline-item')).not.toHaveCount(0);
  await expect(page.locator('.transport')).toBeVisible();

  const result = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const transport = document.querySelector('.transport');
    const transportStyle = getComputedStyle(transport);
    const kicker = document.querySelector('.evo-transport-kicker');
    const current = document.querySelector('#currentTimeLabel');
    const marker = document.querySelector('.evo-transport-marker b');
    const scrubber = document.querySelector('#scrubber');
    const eventCount = document.querySelectorAll('#timelineList .timeline-item').length;

    return {
      surface: root.getPropertyValue('--evo-temporal-surface').trim(),
      backgroundImage: transportStyle.backgroundImage,
      transportRadius: transportStyle.borderRadius,
      kickerSize: parseFloat(getComputedStyle(kicker).fontSize),
      currentSize: parseFloat(getComputedStyle(current).fontSize),
      markerSize: marker ? parseFloat(getComputedStyle(marker).fontSize) : 0,
      scrubberMax: Number(scrubber?.max || 0),
      eventCount,
      builderLoaded: Boolean(window.FlightFlowTimelineBuilderController),
      v4Loaded: Boolean(window.FlightFlowEvolutionShellV4),
    };
  });

  expect(result.surface).toBe('#071722');
  expect(result.backgroundImage).toContain('linear-gradient');
  expect(result.transportRadius).toBe('16px');
  expect(result.kickerSize).toBeGreaterThanOrEqual(9);
  expect(result.currentSize).toBeGreaterThanOrEqual(11);
  expect(result.markerSize).toBeGreaterThanOrEqual(9);
  expect(result.scrubberMax).toBe(result.eventCount - 1);
  expect(result.builderLoaded).toBe(true);
  expect(result.v4Loaded).toBe(true);
});

test('Temporal Deck V6 harmoniza com o tema claro e preserva controles, dark e Velox', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'load' });

  const setMode = mode => page.evaluate(({ theme, palette }) => {
    document.documentElement.dataset.theme = theme;
    if (palette) document.documentElement.dataset.palette = palette;
    else delete document.documentElement.dataset.palette;
  }, mode);

  const readState = () => page.evaluate(() => {
    const transport = document.querySelector('.transport');
    const play = document.querySelector('#playBtn');
    const scrubber = document.querySelector('#scrubber');
    const speed = document.querySelector('#speedSelect');

    return {
      backgroundColor: getComputedStyle(transport).backgroundColor,
      backgroundImage: getComputedStyle(transport).backgroundImage,
      playRadius: getComputedStyle(play).borderRadius,
      scrubberCount: document.querySelectorAll('#scrubber').length,
      speedCount: document.querySelectorAll('#speedSelect').length,
      scrubberType: scrubber?.getAttribute('type'),
      speedValue: speed?.value,
    };
  });

  await setMode({ theme: 'light', palette: '' });
  const light = await readState();
  expect(light.backgroundColor).toBe('rgb(234, 243, 246)');
  expect(light.backgroundImage).toContain('linear-gradient');
  expect(light.playRadius).toBe('5px');
  expect(light.scrubberCount).toBe(1);
  expect(light.speedCount).toBe(1);
  expect(light.scrubberType).toBe('range');
  expect(light.speedValue).toBe('1');

  await setMode({ theme: 'dark', palette: '' });
  const dark = await readState();
  expect(dark.backgroundColor).not.toBe(light.backgroundColor);

  await setMode({ theme: 'light', palette: 'velox' });
  const velox = await readState();
  expect(velox.backgroundColor).not.toBe(light.backgroundColor);
  expect(velox.scrubberCount).toBe(light.scrubberCount);
  expect(velox.speedCount).toBe(light.speedCount);
  expect(velox.scrubberType).toBe(light.scrubberType);
  expect(velox.speedValue).toBe(light.speedValue);
});
