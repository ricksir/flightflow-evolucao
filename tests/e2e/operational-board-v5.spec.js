const { test, expect } = require('@playwright/test');

test('Operational Board V5 mantém o quadro legível e moderno sem alterar a navegação', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'load' });

  const overlayDemo = page.locator('#overlayDemoBtn');
  if (await overlayDemo.isVisible()) await overlayDemo.click();
  else await page.locator('#demoBtn').click();

  await expect(page.locator('#fieldsGrid .field-card').first()).toBeVisible();
  await expect(page.locator('#timelineList .timeline-item')).not.toHaveCount(0);

  const result = await page.evaluate(() => {
    const panel = document.querySelector('.tab-panel[data-panel="data"]');
    const grid = document.querySelector('#fieldsGrid');
    const card = grid?.querySelector('.field-card');
    const label = card?.querySelector('.field-label');
    const value = card?.querySelector('.field-value');
    const eyebrow = panel?.querySelector('.panel-heading .eyebrow');
    const actions = panel?.querySelector('.message-actions');
    const scrubber = document.querySelector('#scrubber');
    const eventCount = document.querySelectorAll('#timelineList .timeline-item').length;

    return {
      panelDisplay: panel ? getComputedStyle(panel).display : '',
      gridGap: grid ? getComputedStyle(grid).gap : '',
      gridColumns: grid ? getComputedStyle(grid).gridTemplateColumns : '',
      cardRadius: card ? getComputedStyle(card).borderRadius : '',
      cardTransform: card ? getComputedStyle(card).transform : '',
      labelSize: label ? parseFloat(getComputedStyle(label).fontSize) : 0,
      valueSize: value ? parseFloat(getComputedStyle(value).fontSize) : 0,
      eyebrowText: eyebrow ? eyebrow.textContent.trim() : '',
      eyebrowVisual: eyebrow ? getComputedStyle(eyebrow, '::after').content : '',
      eyebrowAfterDisplay: eyebrow ? getComputedStyle(eyebrow, '::after').display : '',
      actionsBorderTop: actions ? getComputedStyle(actions).borderTopStyle : '',
      scrubberMax: Number(scrubber?.max || 0),
      eventCount,
      v4Loaded: Boolean(window.FlightFlowEvolutionShellV4),
      builderLoaded: Boolean(window.FlightFlowTimelineBuilderController),
    };
  });

  expect(result.panelDisplay).toBe('flex');
  expect(parseFloat(result.gridGap)).toBeGreaterThanOrEqual(7);
  expect(result.gridColumns.split(' ').length).toBeGreaterThanOrEqual(2);
  expect(parseFloat(result.cardRadius)).toBeGreaterThanOrEqual(10);
  expect(result.cardTransform).toBe('none');
  expect(result.labelSize).toBeGreaterThanOrEqual(10);
  expect(result.valueSize).toBeGreaterThanOrEqual(12);
  expect(result.eyebrowText).toBe('QUADRO ATUAL');
  expect(['none', 'normal', '""']).toContain(result.eyebrowVisual);
  expect(result.eyebrowAfterDisplay).toBe('none');
  expect(result.actionsBorderTop).not.toBe('none');
  expect(result.scrubberMax).toBe(result.eventCount - 1);
  expect(result.v4Loaded).toBe(true);
  expect(result.builderLoaded).toBe(true);
});

test('Operational Board V5 preserva os cards em tema escuro', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'load' });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));

  const overlayDemo = page.locator('#overlayDemoBtn');
  if (await overlayDemo.isVisible()) await overlayDemo.click();
  else await page.locator('#demoBtn').click();

  await expect(page.locator('#fieldsGrid .field-card').first()).toBeVisible();

  const theme = await page.evaluate(() => {
    const card = document.querySelector('#fieldsGrid .field-card');
    const label = card?.querySelector('.field-label');
    return {
      cardRadius: card ? getComputedStyle(card).borderRadius : '',
      labelSize: label ? parseFloat(getComputedStyle(label).fontSize) : 0,
      boardLine: getComputedStyle(document.documentElement).getPropertyValue('--evo-board-line').trim(),
    };
  });

  expect(parseFloat(theme.cardRadius)).toBeGreaterThanOrEqual(10);
  expect(theme.labelSize).toBeGreaterThanOrEqual(10);
  expect(theme.boardLine).toContain('rgba');
});
