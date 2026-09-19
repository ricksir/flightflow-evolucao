const { test, expect } = require('@playwright/test');

test('Pilot Shell V4 projeta marcos reconhecidos na lista e no scrubber sem alterar a timeline', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'load' });

  const overlayDemo = page.locator('#overlayDemoBtn');
  if (await overlayDemo.isVisible()) await overlayDemo.click();
  else await page.locator('#demoBtn').click();

  await expect(page.locator('.timeline-item')).not.toHaveCount(0);
  await expect(page.locator('.timeline-item.milestone-dep').first()).toBeAttached();
  await expect(page.locator('.evo-transport-marker-dep').first()).toBeAttached();

  const projection = await page.evaluate(() => {
    const timeline = Array.from(document.querySelectorAll('.timeline-item.milestone'));
    const markers = Array.from(document.querySelectorAll('#transportMilestones .evo-transport-marker'));
    return {
      timelineCount: timeline.length,
      markerCount: markers.length,
      depTimeline: timeline.filter(item => item.dataset.milestone === 'dep').length,
      depMarkers: markers.filter(item => item.classList.contains('evo-transport-marker-dep')).length,
      scrubberMax: Number(document.querySelector('#scrubber')?.max || 0),
      eventCount: document.querySelectorAll('.timeline-item').length,
      builderLoaded: Boolean(window.FlightFlowTimelineBuilderController),
      v4Loaded: Boolean(window.FlightFlowEvolutionShellV4),
    };
  });

  expect(projection.v4Loaded).toBe(true);
  expect(projection.builderLoaded).toBe(true);
  expect(projection.timelineCount).toBeGreaterThan(0);
  expect(projection.markerCount).toBe(projection.timelineCount);
  expect(projection.depTimeline).toBeGreaterThan(0);
  expect(projection.depMarkers).toBe(projection.depTimeline);
  expect(projection.scrubberMax).toBe(projection.eventCount - 1);
});

test('Pilot Shell V4 mantém identidade e tabs técnicas visíveis', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'load' });
  await expect(page.locator('.evo-product-badge')).toHaveText('EVOLUÇÃO');
  await expect(page.locator('.evo-rail-phase')).toHaveText('SHELL V4');
  await expect(page.locator('.inspector-tabs')).toBeVisible();

  const visual = await page.evaluate(() => {
    const tab = document.querySelector('.tab.active');
    const badge = document.querySelector('.evo-product-badge');
    return {
      tabRadius: getComputedStyle(tab).borderRadius,
      badgeDisplay: getComputedStyle(badge).display,
    };
  });

  expect(visual.tabRadius).toBe('0px');
  expect(['flex', 'inline-flex']).toContain(visual.badgeDisplay);
});
