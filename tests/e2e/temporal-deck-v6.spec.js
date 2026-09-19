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

test('Temporal Deck V6 permanece escuro no tema claro e preserva os controles originais', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'load' });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));

  const result = await page.evaluate(() => {
    const transport = document.querySelector('.transport');
    const play = document.querySelector('#playBtn');
    const scrubber = document.querySelector('#scrubber');
    const speed = document.querySelector('#speedSelect');

    return {
      backgroundImage: getComputedStyle(transport).backgroundImage,
      playRadius: getComputedStyle(play).borderRadius,
      scrubberCount: document.querySelectorAll('#scrubber').length,
      speedCount: document.querySelectorAll('#speedSelect').length,
      scrubberType: scrubber?.getAttribute('type'),
      speedValue: speed?.value,
    };
  });

  expect(result.backgroundImage).toContain('linear-gradient');
  expect(result.playRadius).toBe('5px');
  expect(result.scrubberCount).toBe(1);
  expect(result.speedCount).toBe(1);
  expect(result.scrubberType).toBe('range');
  expect(result.speedValue).toBe('1');
});
