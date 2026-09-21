const { test, expect } = require('@playwright/test');

function rgb(value) {
  const match = String(value || '').match(/rgba?\(([^)]+)\)/);
  if (!match) return [0,0,0];
  return match[1].split(',').slice(0,3).map(Number);
}

function luminance([r,g,b]) {
  const parts = [r,g,b].map(value => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * parts[0] + 0.7152 * parts[1] + 0.0722 * parts[2];
}

function contrast(fg, bg) {
  const a = luminance(rgb(fg));
  const b = luminance(rgb(bg));
  return (Math.max(a,b) + 0.05) / (Math.min(a,b) + 0.05);
}

async function loadDemo(page, viewport = { width: 1600, height: 900 }) {
  await page.setViewportSize(viewport);
  await page.goto('/index.html', { waitUntil: 'load' });

  const overlayDemo = page.locator('#overlayDemoBtn');
  if (await overlayDemo.isVisible()) await overlayDemo.click();
  else await page.locator('#demoBtn').click();

  await expect(page.locator('#fieldsGrid .field-card').first()).toBeVisible();
  await expect(page.locator('.timeline-item')).not.toHaveCount(0);

  await expect(page.locator('#playBtn')).toHaveAttribute('title', /Pausar/, { timeout: 5_000 });
  await page.locator('#restartBtn').click();
  await expect(page.locator('#playBtn')).toHaveAttribute('title', /Reproduzir/);
}

async function metrics(page) {
  return page.evaluate(() => {
    const style = selector => {
      const node = document.querySelector(selector);
      return node ? getComputedStyle(node) : null;
    };
    const rect = selector => document.querySelector(selector)?.getBoundingClientRect() || null;
    const firstChanged = document.querySelector('#fieldsGrid .field-card.changed');
    const changeTag = firstChanged?.querySelector('.change-tag');

    return {
      viewportWidth: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      workspace: rect('.workspace-card'),
      inspector: rect('.inspector-card'),
      scene: rect('.scene-wrap'),
      labelSize: parseFloat(style('#fieldsGrid .field-card .field-label')?.fontSize || '0'),
      valueSize: parseFloat(style('#fieldsGrid .field-card .field-value')?.fontSize || '0'),
      headingSize: parseFloat(style('[data-panel="data"] .panel-heading h2')?.fontSize || '0'),
      tabSize: parseFloat(style('.inspector-tabs .tab')?.fontSize || '0'),
      timelineOpSize: parseFloat(style('.timeline-op')?.fontSize || '0'),
      mapControlSize: parseFloat(style('.real-map-control-group button')?.fontSize || '0'),
      captionSize: parseFloat(style('.scene-caption p')?.fontSize || '0'),
      cardHeight: rect('#fieldsGrid .field-card')?.height || 0,
      cardBackground: style('#fieldsGrid .field-card')?.backgroundColor || '',
      labelColor: style('#fieldsGrid .field-card .field-label')?.color || '',
      valueColor: style('#fieldsGrid .field-card .field-value')?.color || '',
      changeTagSize: changeTag ? parseFloat(getComputedStyle(changeTag).fontSize) : 0,
      changeTagOpacity: changeTag ? parseFloat(getComputedStyle(changeTag).opacity) : 0,
      changeTagText: changeTag?.textContent?.trim() || '',
    };
  });
}

test('PR23 melhora legibilidade do Quadro sem tirar a dominância do mapa', async ({ page }) => {
  await loadDemo(page);
  const m = await metrics(page);

  expect(m.scrollWidth).toBeLessThanOrEqual(m.viewportWidth + 1);
  expect(m.workspace.width).toBeGreaterThan(m.inspector.width * 2);
  expect(m.scene.width).toBeGreaterThan(m.workspace.width * 0.9);

  expect(m.labelSize).toBeGreaterThanOrEqual(11);
  expect(m.valueSize).toBeGreaterThanOrEqual(13.5);
  expect(m.headingSize).toBeGreaterThanOrEqual(15);
  expect(m.tabSize).toBeGreaterThanOrEqual(11);
  expect(m.timelineOpSize).toBeGreaterThanOrEqual(12);
  expect(m.mapControlSize).toBeGreaterThanOrEqual(11);
  expect(m.captionSize).toBeGreaterThanOrEqual(11);
  expect(m.cardHeight).toBeGreaterThanOrEqual(60);

  expect(contrast(m.valueColor, m.cardBackground)).toBeGreaterThanOrEqual(4.5);
});

test('PR23 mantém ATUALIZADO secundário em relação ao valor operacional', async ({ page }) => {
  await loadDemo(page);

  const changed = page.locator('#fieldsGrid .field-card.changed').first();
  if (await changed.count()) {
    const tag = changed.locator('.change-tag');
    await expect(tag).toBeVisible();

    const m = await metrics(page);
    expect(m.changeTagText.toUpperCase()).toContain('ATUALIZ');
    expect(m.changeTagSize).toBeLessThan(m.valueSize);
    expect(m.changeTagSize).toBeLessThanOrEqual(8.5);
    expect(m.changeTagOpacity).toBeLessThanOrEqual(0.8);
  }
});

for (const mode of [
  { name:'claro', theme:'light', palette:'' },
  { name:'escuro', theme:'dark', palette:'' },
  { name:'Velox', theme:'dark', palette:'velox' },
]) {
  test(`PR23 preserva legibilidade operacional no tema ${mode.name}`, async ({ page }) => {
    await loadDemo(page);
    await page.evaluate(({theme,palette}) => {
      document.documentElement.dataset.theme = theme;
      if (palette) document.documentElement.dataset.palette = palette;
      else delete document.documentElement.dataset.palette;
    }, mode);

    // Os cards possuem transição curta de background. A aceitação mede o
    // estado visual estabilizado, não o frame intermediário da troca de tema.
    await page.waitForTimeout(200);

    const m = await metrics(page);
    expect(m.labelSize).toBeGreaterThanOrEqual(11);
    expect(m.valueSize).toBeGreaterThanOrEqual(13.5);
    expect(contrast(m.valueColor, m.cardBackground)).toBeGreaterThanOrEqual(4.5);
    expect(m.scrollWidth).toBeLessThanOrEqual(m.viewportWidth + 1);
  });
}

for (const viewport of [
  { width: 1024, height: 820 },
  { width: 820, height: 900 },
  { width: 600, height: 900 },
]) {
  test(`PR23 mantém leitura e ausência de overflow em ${viewport.width}px`, async ({ page }) => {
    await loadDemo(page, viewport);
    const m = await metrics(page);

    expect(m.scrollWidth).toBeLessThanOrEqual(m.viewportWidth + 1);
    expect(m.labelSize).toBeGreaterThanOrEqual(10.5);
    expect(m.valueSize).toBeGreaterThanOrEqual(13);
    expect(m.tabSize).toBeGreaterThanOrEqual(10.5);
  });
}
