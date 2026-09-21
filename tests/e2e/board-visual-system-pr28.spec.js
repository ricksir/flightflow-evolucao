const { test, expect } = require('@playwright/test');

function rgb(value) {
  const match = String(value || '').match(/rgba?\(([^)]+)\)/);
  return match ? match[1].split(',').slice(0, 3).map(Number) : [0, 0, 0];
}

function luminance([r, g, b]) {
  const c = [r, g, b].map(v => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function contrast(fg, bg) {
  const a = luminance(rgb(fg));
  const b = luminance(rgb(bg));
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

async function loadDemo(page) {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('/index.html', { waitUntil: 'load' });

  const overlay = page.locator('#overlayDemoBtn');
  if (await overlay.isVisible()) await overlay.click();
  else {
    const demo = page.locator('#demoBtn');
    if (await demo.count()) await demo.click();
  }

  await expect(page.locator('#fieldsGrid .field-card').first()).toBeVisible();
  await expect(page.locator('.workspace-card')).toBeVisible();
  await expect(page.locator('.inspector-card')).toBeVisible();
}

async function setMode(page, theme, palette = '') {
  await page.evaluate(({ theme, palette }) => {
    document.documentElement.dataset.theme = theme;
    if (palette) document.documentElement.dataset.palette = palette;
    else delete document.documentElement.dataset.palette;
  }, { theme, palette });
  await page.evaluate(() => new Promise(resolve =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function findChangedState(page) {
  for (let i = 0; i < 40; i += 1) {
    if (await page.locator('#fieldsGrid .change-tag').count()) return;
    const next = page.locator('#nextBtn');
    if (!(await next.count()) || await next.isDisabled()) break;
    await next.click();
  }
}

test('PR28 remove grade rígida e cria cards premium no Quadro Atual', async ({ page }) => {
  await loadDemo(page);
  await setMode(page, 'light');

  const m = await page.evaluate(() => {
    const q = s => document.querySelector(s);
    const grid = q('[data-panel="data"] .fields-grid');
    const card = q('#fieldsGrid .field-card');
    const label = card.querySelector('.field-label');
    const value = card.querySelector('.field-value');
    const heading = q('[data-panel="data"] .panel-heading h2');
    const gs = getComputedStyle(grid);
    const cs = getComputedStyle(card);
    const ls = getComputedStyle(label);
    const vs = getComputedStyle(value);
    const hs = getComputedStyle(heading);
    const workspace = q('.workspace-card').getBoundingClientRect();
    const inspector = q('.inspector-card').getBoundingClientRect();

    return {
      gap: Math.max(parseFloat(gs.rowGap) || 0, parseFloat(gs.columnGap) || 0),
      gridBorderLeft: parseFloat(gs.borderLeftWidth) || 0,
      radius: parseFloat(cs.borderRadius),
      borderWidth: parseFloat(cs.borderTopWidth),
      cardBg: cs.backgroundColor,
      gridBg: gs.backgroundColor,
      labelSize: parseFloat(ls.fontSize),
      valueSize: parseFloat(vs.fontSize),
      headingSize: parseFloat(hs.fontSize),
      labelColor: ls.color,
      valueColor: vs.color,
      cardFont: cs.fontFamily,
      workspaceWidth: workspace.width,
      inspectorWidth: inspector.width,
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: innerWidth,
    };
  });

  expect(m.gap).toBeGreaterThanOrEqual(7);
  expect(m.gridBorderLeft).toBe(0);
  expect(m.radius).toBeGreaterThanOrEqual(10);
  expect(m.borderWidth).toBeGreaterThanOrEqual(1);
  expect(m.cardBg).not.toBe('rgba(0, 0, 0, 0)');
  expect(m.labelSize).toBeGreaterThanOrEqual(11.5);
  expect(m.valueSize).toBeGreaterThanOrEqual(14.5);
  expect(m.headingSize).toBeGreaterThanOrEqual(18);
  expect(contrast(m.labelColor, m.cardBg)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(m.valueColor, m.cardBg)).toBeGreaterThanOrEqual(4.5);
  expect(m.cardFont).toMatch(/Inter|Segoe UI|system-ui/i);
  expect(m.workspaceWidth).toBeGreaterThan(m.inspectorWidth * 2);
  expect(m.scrollWidth).toBeLessThanOrEqual(m.viewportWidth + 1);
});

test('PR28 mantém ATUALIZADO secundário e compatibiliza Quadro Atual com Alterações', async ({ page }) => {
  await loadDemo(page);
  await setMode(page, 'light');
  await findChangedState(page);

  const changed = page.locator('#fieldsGrid .field-card.changed').first();
  const tag = page.locator('#fieldsGrid .change-tag').first();
  await expect(changed).toBeAttached();
  await expect(tag).toBeAttached();

  const metrics = await page.evaluate(() => {
    const changed = document.querySelector('#fieldsGrid .field-card.changed');
    const tag = changed.querySelector('.change-tag');
    const value = changed.querySelector('.field-value');

    let change = document.querySelector('.change-item');
    let synthetic = false;
    if (!change) {
      synthetic = true;
      change = document.createElement('div');
      change.className = 'change-item';
      change.textContent = 'Amostra visual de Alterações';
      document.body.appendChild(change);
    }

    const cardStyle = getComputedStyle(changed);
    const changeStyle = getComputedStyle(change);
    const result = {
      tagSize: parseFloat(getComputedStyle(tag).fontSize),
      valueSize: parseFloat(getComputedStyle(value).fontSize),
      cardRadius: parseFloat(cardStyle.borderRadius),
      changeRadius: parseFloat(changeStyle.borderRadius),
      cardBorder: parseFloat(cardStyle.borderTopWidth),
      changeBorder: parseFloat(changeStyle.borderTopWidth),
      cardBorderStyle: cardStyle.borderTopStyle,
      changeBorderStyle: changeStyle.borderTopStyle,
      synthetic,
    };

    if (synthetic) change.remove();
    return result;
  });

  expect(metrics.tagSize).toBeLessThan(metrics.valueSize);
  expect(metrics.tagSize).toBeLessThanOrEqual(10);
  expect(Math.abs(metrics.cardRadius - metrics.changeRadius)).toBeLessThanOrEqual(2);
  expect(metrics.cardBorder).toBeGreaterThanOrEqual(1);
  expect(metrics.changeBorder).toBeGreaterThanOrEqual(1);
  expect(metrics.cardBorderStyle).toBe('solid');
  expect(metrics.changeBorderStyle).toBe('solid');
});

for (const mode of [
  { theme: 'light', palette: '', label: 'claro' },
  { theme: 'dark', palette: '', label: 'escuro' },
  { theme: 'dark', palette: 'velox', label: 'Velox' },
]) {
  test('PR28 preserva legibilidade e composição no tema ' + mode.label, async ({ page }) => {
    await loadDemo(page);
    await setMode(page, mode.theme, mode.palette);

    const m = await page.evaluate(() => {
      const card = document.querySelector('#fieldsGrid .field-card');
      const label = card.querySelector('.field-label');
      const value = card.querySelector('.field-value');
      const grid = document.querySelector('[data-panel="data"] .fields-grid');
      const heading = document.querySelector('[data-panel="data"] .panel-heading h2');
      const workspace = document.querySelector('.workspace-card').getBoundingClientRect();
      const inspector = document.querySelector('.inspector-card').getBoundingClientRect();
      const cs = getComputedStyle(card);

      return {
        bg: cs.backgroundColor,
        label: getComputedStyle(label).color,
        value: getComputedStyle(value).color,
        labelSize: parseFloat(getComputedStyle(label).fontSize),
        valueSize: parseFloat(getComputedStyle(value).fontSize),
        headingSize: parseFloat(getComputedStyle(heading).fontSize),
        radius: parseFloat(cs.borderRadius),
        gap: parseFloat(getComputedStyle(grid).columnGap) || 0,
        workspaceWidth: workspace.width,
        inspectorWidth: inspector.width,
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth: innerWidth,
      };
    });

    expect(m.labelSize).toBeGreaterThanOrEqual(11.5);
    expect(m.valueSize).toBeGreaterThanOrEqual(14.5);
    expect(m.headingSize).toBeGreaterThanOrEqual(18);
    expect(m.radius).toBeGreaterThanOrEqual(10);
    expect(m.gap).toBeGreaterThanOrEqual(7);
    expect(contrast(m.label, m.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(m.value, m.bg)).toBeGreaterThanOrEqual(4.5);
    expect(m.workspaceWidth).toBeGreaterThan(m.inspectorWidth * 2);
    expect(m.scrollWidth).toBeLessThanOrEqual(m.viewportWidth + 1);
  });
}
