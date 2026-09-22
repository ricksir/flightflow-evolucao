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
  await expect(page.locator('.evo-rail-phase')).toBeVisible();
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


test('PR46 mantém rótulos densos do scrubber sem colisão em 1600x900', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('/index.html', { waitUntil: 'load' });

  const overlayDemo = page.locator('#overlayDemoBtn');
  if (await overlayDemo.isVisible()) await overlayDemo.click();
  else await page.locator('#demoBtn').click();

  await expect(page.locator('.evo-transport-marker-dep').first()).toBeAttached();

  const result = await page.evaluate(() => {
    const allDepLabels = [...document.querySelectorAll('#transportMilestones .evo-transport-marker-dep b')];
    const labels = [...document.querySelectorAll('#transportMilestones .evo-transport-marker b')]
      .filter(node => {
        const r = node.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      })
      .map(node => {
        const r = node.getBoundingClientRect();
        return {
          text: (node.textContent || '').trim(),
          left: r.left,
          right: r.right,
          top: r.top,
          bottom: r.bottom,
        };
      });

    const overlaps = [];
    for (let i = 0; i < labels.length; i += 1) {
      for (let j = i + 1; j < labels.length; j += 1) {
        const a = labels[i];
        const b = labels[j];
        const intersects = a.left < b.right && a.right > b.left &&
          a.top < b.bottom && a.bottom > b.top;
        if (intersects) overlaps.push([a.text, b.text]);
      }
    }
    return {
      count: labels.length,
      totalDepCount: allDepLabels.length,
      visibleDepCount: labels.filter(item => item.text === 'DEP').length,
      hiddenDepCount: allDepLabels.filter(node => {
        const r = node.getBoundingClientRect();
        return r.width === 0 || r.height === 0;
      }).length,
      overlaps,
    };
  });

  // Todos os ticks permanecem; somente textos DEP redundantes podem ser ocultados para evitar colisão.
  expect(result.totalDepCount).toBeGreaterThanOrEqual(4);
  expect(result.visibleDepCount).toBeGreaterThanOrEqual(2);
  expect(result.hiddenDepCount).toBeGreaterThan(0);
  expect(result.visibleDepCount).toBeLessThan(result.totalDepCount);
  expect(result.overlaps).toEqual([]);
});
