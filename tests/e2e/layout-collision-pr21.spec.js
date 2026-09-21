const { test, expect } = require('@playwright/test');

async function loadDemo(page, viewport) {
  await page.setViewportSize(viewport);
  await page.goto('/index.html', { waitUntil: 'load' });

  const overlayDemo = page.locator('#overlayDemoBtn');
  if (await overlayDemo.isVisible()) await overlayDemo.click();
  else await page.locator('#demoBtn').click();

  await expect(page.locator('#scrubber')).toBeEnabled();
  await expect(page.locator('.timeline-item')).not.toHaveCount(0);
  await expect(page.locator('.evo-transport-marker')).not.toHaveCount(0);

  await expect(page.locator('#playBtn')).toHaveAttribute('title', /Pausar/, { timeout: 5_000 });
  await page.locator('#restartBtn').click();
  await expect(page.locator('#playBtn')).toHaveAttribute('title', /Reproduzir/);
}

function intersects(a, b, tolerance = 0.5) {
  return !(
    a.right <= b.left + tolerance ||
    b.right <= a.left + tolerance ||
    a.bottom <= b.top + tolerance ||
    b.bottom <= a.top + tolerance
  );
}

async function geometrySnapshot(page) {
  return page.evaluate(() => {
    const rect = selector => {
      const node = document.querySelector(selector);
      if (!node) return null;
      const r = node.getBoundingClientRect();
      return { left:r.left, top:r.top, right:r.right, bottom:r.bottom, width:r.width, height:r.height };
    };
    const rects = selector => Array.from(document.querySelectorAll(selector)).map(node => {
      const r = node.getBoundingClientRect();
      return {
        text: node.textContent?.trim() || '',
        left:r.left, top:r.top, right:r.right, bottom:r.bottom, width:r.width, height:r.height,
        visible: r.width > 0 && r.height > 0 && getComputedStyle(node).visibility !== 'hidden'
      };
    }).filter(item => item.visible);

    return {
      viewport: { width: innerWidth, height: innerHeight },
      scrollWidth: document.documentElement.scrollWidth,
      sceneHead: rect('.scene-head'),
      sceneWrap: rect('.scene-wrap'),
      statusItems: rects('.scene-status > :not(.evo-status-kicker)'),
      statusKicker: rect('.evo-status-kicker'),
      protocolToggle: rect('#showProtocolBtn'),
      scrubberWrap: rect('.scrubber-wrap'),
      scrubber: rect('#scrubber'),
      transportKicker: rect('.evo-transport-kicker'),
      milestoneLabels: rects('.evo-transport-marker b'),
      transport: rect('.transport'),
    };
  });
}

for (const viewport of [
  { width: 1600, height: 900 },
  { width: 1024, height: 820 },
  { width: 820, height: 900 },
]) {
  test(`PR21 evita colisões no viewport ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await loadDemo(page, viewport);
    const g = await geometrySnapshot(page);

    expect(g.scrollWidth).toBeLessThanOrEqual(g.viewport.width + 1);
    expect(g.sceneHead).not.toBeNull();
    expect(g.sceneWrap).not.toBeNull();
    expect(g.protocolToggle).not.toBeNull();
    expect(g.scrubber).not.toBeNull();
    expect(g.transportKicker).not.toBeNull();
    expect(g.milestoneLabels.length).toBeGreaterThan(0);

    expect(g.protocolToggle.bottom).toBeLessThanOrEqual(g.sceneHead.bottom + 1);
    expect(g.protocolToggle.top).toBeGreaterThanOrEqual(g.sceneHead.top - 1);
    expect(intersects(g.protocolToggle, g.sceneWrap, 0)).toBe(false);

    for (let i = 0; i < g.statusItems.length; i += 1) {
      for (let j = i + 1; j < g.statusItems.length; j += 1) {
        expect(intersects(g.statusItems[i], g.statusItems[j], 0.25)).toBe(false);
      }
    }

    for (const label of g.milestoneLabels) {
      expect(intersects(label, g.transportKicker, 0.25)).toBe(false);
      expect(intersects(label, g.scrubber, 0.25)).toBe(false);
      expect(label.top).toBeGreaterThanOrEqual(g.scrubberWrap.top - 1);
      expect(label.bottom).toBeLessThanOrEqual(g.scrubber.bottom + 1);
    }
  });
}

test('PR21 mantém a janela de mensagem dentro do viewport e fora do transporte', async ({ page }) => {
  await loadDemo(page, { width: 1024, height: 820 });

  await page.locator('#showProtocolBtn').click();
  await expect(page.locator('#protocolCard')).toBeVisible();

  const geometry = await page.evaluate(() => {
    const card = document.querySelector('#protocolCard').getBoundingClientRect();
    const transport = document.querySelector('.transport').getBoundingClientRect();
    return {
      viewport: { width: innerWidth, height: innerHeight },
      card: { left:card.left, top:card.top, right:card.right, bottom:card.bottom },
      transport: { left:transport.left, top:transport.top, right:transport.right, bottom:transport.bottom },
    };
  });

  expect(geometry.card.left).toBeGreaterThanOrEqual(-1);
  expect(geometry.card.top).toBeGreaterThanOrEqual(-1);
  expect(geometry.card.right).toBeLessThanOrEqual(geometry.viewport.width + 1);
  expect(geometry.card.bottom).toBeLessThanOrEqual(geometry.transport.top - 4);

  await page.locator('#hideProtocolBtn').click();
  await expect(page.locator('#protocolCard')).toBeHidden();
});
