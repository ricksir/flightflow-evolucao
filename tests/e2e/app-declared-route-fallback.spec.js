const { test, expect } = require('@playwright/test');

const APP_FIXTURE = String.raw`
Indicativo do plano: TAM3720
ADEP: SBBR
ADES: SBCF

############################################################
OPERAÇÃO : Criação por Mensagem Automática (TTY)
data:   09/07/2026      hora:   12:05:05      posição: SPA01      ambiente: OpA
Estado: PRE Setor anterior: NUL NUL atual: DS NUL NUL seguinte: DS NUL NUL
Indicativo       : TAM3720
ADEP             : SBBR
ADES             : SBCF
IDPLANO          : C9Z7MG00
Rota             : GEPMO UZ35 REINA

############################################################
OPERAÇÃO : Recepção de Mensagem DEP
data:   09/07/2026      hora:   12:29:11      posição: SPA01      ambiente: OpA
Estado: ATV Setor anterior: NUL NUL atual: DS REC NUL seguinte: DS REC NUL
Conteúdo         :
(DEPSBBR/SBBR058-TAM3720-SBBR1229-SBCF-DOF/260709)
############################################################
`;

test('histórico APP sem PONTOS exibe rota declarada UZ35 e seus fixos no mapa', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'load' });
  await expect.poll(() => page.evaluate(() => Boolean(window.FlightFlowRouteProcessedV7412))).toBe(true);

  await page.evaluate(fixture => {
    const original = document.querySelector('#originalFullText');
    const selected = document.querySelector('#selectedFileLabel');
    if (!original || !selected) throw new Error('ponte de histórico do FlightFlow indisponível');
    if ('value' in original) original.value = fixture;
    original.textContent = fixture;
    selected.textContent = 'TAM3720APP-fixture.txt';
  }, APP_FIXTURE);

  await expect.poll(() => page.evaluate(() =>
    window.FlightFlowRouteProcessedV7412?.getModel?.().history?.callsign || ''
  )).toBe('TAM3720');

  const result = await page.evaluate(() => {
    const api = window.FlightFlowRouteProcessedV7412;
    const model = api.getModel();
    const snapshot = model.resolvedSnapshots[0];
    return {
      historyLoaded: Boolean(model.history),
      declaredFallback: Boolean(snapshot?.declaredFallback),
      ids: snapshot?.points?.map(point => point.ident) || [],
      geos: snapshot?.points?.map(point => ({
        ident: point.ident,
        lat: Number(point.geo?.lat),
        lon: Number(point.geo?.lon),
      })) || [],
      timedLimit: snapshot ? api.timedProgressLimit(snapshot) : null,
    };
  });

  expect(result.historyLoaded).toBe(true);
  expect(result.declaredFallback).toBe(true);
  expect(result.ids).toEqual(['SBBR', 'GEPMO', 'ANBIR', 'IREGU', 'REINA']);
  expect(result.geos.every(point => Number.isFinite(point.lat) && Number.isFinite(point.lon))).toBe(true);
  expect(result.timedLimit).toBe(0);

  await expect(page.locator('#ffrpOpen')).toBeVisible();
  await page.locator('#ffrpOpen').click();
  await expect(page.locator('#ffrpModal')).toBeVisible();

  await expect(page.locator('#ffrpSubtitle')).toContainText('sem quadro PONTOS/ETIM');
  await expect(page.locator('#ffrpTime')).toContainText('sem ETIM histórico');
  await expect(page.locator('#ffrpRouteList .ffrp-point')).toHaveCount(6);

  for (const ident of ['SBBR', 'GEPMO', 'ANBIR', 'IREGU', 'REINA', 'SBCF']) {
    await expect(page.locator('#ffrpRouteList')).toContainText(ident);
  }

  const visual = await page.evaluate(() => {
    const declared = document.querySelectorAll('#ffrpMap .route-declared').length;
    const historical = document.querySelectorAll('#ffrpMap .route-line').length;
    const pointCount = document.querySelectorAll('#ffrpMap .wp').length;
    const destinationPreview = document.querySelectorAll('#ffrpMap .ffrp-declared-destination-preview[data-declared-destination="1"]').length;
    const mapText = document.querySelector('#ffrpMap')?.textContent || '';
    const routeCards = Array.from(document.querySelectorAll('#ffrpRouteList .ffrp-point'))
      .map(node => node.textContent || '');
    return { declared, historical, pointCount, destinationPreview, mapText, routeCards };
  });

  expect(visual.declared).toBeGreaterThanOrEqual(1);
  expect(visual.historical).toBe(0);
  expect(visual.pointCount).toBeGreaterThanOrEqual(6);
  expect(visual.destinationPreview).toBe(1);
  for (const ident of ['SBBR', 'GEPMO', 'ANBIR', 'IREGU', 'REINA', 'SBCF']) {
    expect(visual.mapText).toContain(ident);
  }
  expect(visual.routeCards.join(' ')).not.toMatch(/ETIM\s+\d/);
});


const APP_NO_EXPANDABLE_ROUTE = String.raw`
Indicativo do plano: PSFBU
ADEP: SBBR
ADES: SBGO

############################################################
OPERAÇÃO : Criação por Mensagem Automática (TTY)
data:   09/07/2026      hora:   12:42:10      posição: SPA01      ambiente: OpA
Estado: PRE Setor anterior: NUL NUL atual: T4 NUL NUL seguinte: T4 NUL NUL
Indicativo       : PSFBU
ADEP             : SBBR
ADES             : SBGO
IDPLANO          : PLFWLN99
Rota             : DCT

############################################################
OPERAÇÃO : Recepção de Mensagem TTY CNL
data:   09/07/2026      hora:   12:48:36      posição: SPA01      ambiente: OpA
Estado: TER Setor anterior: NUL NUL atual: T4 NUL NUL seguinte: T4 NUL NUL
Conteúdo         :
(FPVD/CNL PSFBU SBBR SBGO)
############################################################
`;

test('troca para APP sem rota expansível não conserva a Rota Processada do plano anterior', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'load' });
  await expect.poll(() => page.evaluate(() => Boolean(window.FlightFlowRouteProcessedV7412))).toBe(true);

  const result = await page.evaluate(async ({ valid, unsupported }) => {
    const api = window.FlightFlowRouteProcessedV7412;
    await api.analyzeText(valid, 'TAM3720APP-fixture.txt');
    const before = {
      callsign: api.getModel().history?.callsign || '',
      snapshots: api.getModel().resolvedSnapshots.length,
    };

    const returned = await api.analyzeText(unsupported, 'PSFBUAPP-fixture.txt');
    const model = api.getModel();
    return {
      before,
      returnedNull: returned === null,
      historyLoaded: Boolean(model.history),
      snapshots: model.resolvedSnapshots.length,
      movementProfile: Boolean(model.movementProfile),
      openHidden: Boolean(document.querySelector('#ffrpOpen')?.hidden),
      processedMetadata: Boolean(window.__FlightFlowFirBridge?.state?.geo?.ffrpProcessedRoute),
    };
  }, { valid: APP_FIXTURE, unsupported: APP_NO_EXPANDABLE_ROUTE });

  expect(result.before.callsign).toBe('TAM3720');
  expect(result.before.snapshots).toBeGreaterThan(0);
  expect(result.returnedNull).toBe(true);
  expect(result.historyLoaded).toBe(false);
  expect(result.snapshots).toBe(0);
  expect(result.movementProfile).toBe(false);
  expect(result.openHidden).toBe(true);
  expect(result.processedMetadata).toBe(false);
});


const APP_DERIVED_FIXTURE = APP_FIXTURE
  .replace('Indicativo       : TAM3720\nADEP', 'Indicativo       : TAM3720\nVelocidade       : N0450\nADEP')
  + String.raw`
OPERAÇÃO : Recepção de Mensagem ACP
data:   09/07/2026      hora:   12:35:08      posição: SPA01      ambiente: OpA
Estado: TRF Setor anterior: T3 NUL NUL atual: T3 NUL NUL seguinte: BS NUL NUL
Conteúdo         :
(ACPSBBS/SBBR076-TAM3720/A4063-SBBR-SBCF)

############################################################
OPERAÇÃO : Evento Automático de Término
data:   09/07/2026      hora:   12:46:04      posição: SPA01      ambiente: OpA
Estado: TER Setor anterior: T3 NUL NUL atual: T3 NUL NUL seguinte: BS NUL NUL

############################################################
OPERAÇÃO : Evento Automático de Arquivamento
data:   10/07/2026      hora:   00:46:43      posição: SPA01      ambiente: OpA
Estado: ARQ Setor anterior: T3 NUL NUL atual: T3 NUL NUL seguinte: BS NUL NUL
############################################################
`;



test('APP derivado exibe todos os fixos da rota processada também no mapa principal', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'load' });
  await expect.poll(() => page.evaluate(() => Boolean(window.FlightFlowRouteProcessedV7412 && window.FlightParser))).toBe(true);

  const result = await page.evaluate(async fixture => {
    const api = window.FlightFlowRouteProcessedV7412;
    const bridge = window.__FlightFlowFirBridge;
    const parsed = window.FlightParser.parseHistoryText(fixture, { includeRawText: true });
    bridge.state.parsed = parsed;
    bridge.state.index = parsed.events.findIndex(event => event.messageType === 'ACP');
    bridge.state.geo.eventRoutes = [];
    await api.analyzeText(fixture, 'TAM3720APP-main-map-e2e.txt');
    api.setFixesVisible(true);
    api.applyProcessedRouteToFlightFlow();

    const model = api.getModel();
    const engine = bridge.realMapState?.engine || '';
    const vector = document.querySelector('#ffrpVectorFixLayer');
    const vectorTitles = Array.from(vector?.querySelectorAll('.ffrp-vfix title') || [])
      .map(node => node.textContent || '');

    const nativeFixes = model.nativeFixLayer?.getLayers?.() || [];
    const nativeRoutes = model.nativeMapLayer?.getLayers?.() || [];
    const nativeTitles = nativeFixes.map(layer => {
      const content = layer.getTooltip?.()?.getContent?.();
      return typeof content === 'string' ? content : String(content || '');
    });

    return {
      engine,
      routeCount: engine === 'leaflet'
        ? nativeRoutes.length
        : (vector?.querySelectorAll('.ffrp-vroute-declared').length || 0),
      fixCount: engine === 'leaflet'
        ? nativeFixes.length
        : (vector?.querySelectorAll('.ffrp-vfix').length || 0),
      labels: engine === 'leaflet' ? nativeTitles : vectorTitles,
      text: engine === 'leaflet' ? nativeTitles.join(' ') : (vector?.textContent || ''),
    };
  }, APP_DERIVED_FIXTURE);

  expect(result.routeCount).toBeGreaterThanOrEqual(1);
  expect(result.fixCount).toBeGreaterThanOrEqual(6);
  for (const ident of ['SBBR', 'GEPMO', 'ANBIR', 'IREGU', 'REINA', 'SBCF']) {
    expect(result.text).toContain(ident);
  }
  for (const ident of ['GEPMO', 'ANBIR', 'IREGU', 'REINA']) {
    expect(result.labels.some(label => label.includes(ident))).toBe(true);
  }
});

test('APP sem ETIM avança pela rota derivada após DEP e congela no TER da jurisdição', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'load' });
  await expect.poll(() => page.evaluate(() => Boolean(window.FlightFlowRouteProcessedV7412 && window.FlightParser))).toBe(true);

  const setup = await page.evaluate(async fixture => {
    const api = window.FlightFlowRouteProcessedV7412;
    const bridge = window.__FlightFlowFirBridge;
    const parsed = window.FlightParser.parseHistoryText(fixture, { includeRawText: true });
    bridge.state.parsed = parsed;
    bridge.state.index = 0;
    bridge.state.geo.eventRoutes = [];
    await api.analyzeText(fixture, 'TAM3720APP-derived-e2e.txt');

    const model = api.getModel();
    const profile = model.movementProfile;
    const depIndex = parsed.events.findIndex(event => event.messageType === 'DEP');
    const transferIndex = parsed.events.findIndex(event => event.messageType === 'ACP');
    const terIndex = parsed.events.findIndex(event => /Término/i.test(event.operation));
    const archiveIndex = parsed.events.findIndex(event => /Arquivamento/i.test(event.operation));

    bridge.state.index = terIndex;
    api.applyProcessedRouteToFlightFlow();
    model.lastNativeIndex = -1;
    return {
      mode: profile?.mode || '', depIndex, transferIndex, terIndex, archiveIndex,
      depTarget: profile?.targets?.[depIndex],
      transferTarget: profile?.targets?.[transferIndex],
      terTarget: profile?.targets?.[terIndex],
      archiveTarget: profile?.targets?.[archiveIndex],
      routeTarget: bridge.state.geo.eventRoutes?.[terIndex]?.target,
    };
  }, APP_DERIVED_FIXTURE);

  expect(setup.mode).toBe('derived');
  expect(setup.depTarget).toBe(0);
  expect(setup.transferTarget).toBeGreaterThan(0);
  expect(setup.terTarget).toBeGreaterThan(setup.transferTarget);
  expect(setup.terTarget).toBeLessThan(1);
  expect(setup.archiveTarget).toBe(setup.terTarget);
  expect(setup.routeTarget).toBe(setup.terTarget);

  await expect.poll(() => page.evaluate(() => Number(window.__FlightFlowFirBridge?.state?.motion?.targetProgress || 0))).toBeGreaterThan(0);

  await page.locator('#ffrpOpen').click();
  await expect(page.locator('#ffrpModal')).toBeVisible();
  await expect(page.locator('#ffrpTime')).toContainText('posição derivada por DEP + rota/velocidade');
  await expect.poll(() => page.locator('#ffrpRange').evaluate(input => Number(input.value))).toBeGreaterThan(0);
  await expect(page.locator('#ffrpRouteList .ffrp-point.active-point')).not.toContainText('SBBR');
});


test('controles da Rota Processada navegam evento a evento e sincronizam progresso APP derivado', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'load' });
  await expect.poll(() => page.evaluate(() => Boolean(window.FlightFlowRouteProcessedV7412 && window.FlightParser))).toBe(true);

  const setup = await page.evaluate(async fixture => {
    const api = window.FlightFlowRouteProcessedV7412;
    const bridge = window.__FlightFlowFirBridge;
    const parsed = window.FlightParser.parseHistoryText(fixture, { includeRawText: true });
    bridge.state.parsed = parsed;
    bridge.state.index = 0;
    bridge.state.geo.eventRoutes = [];
    if (bridge.state.motion) {
      bridge.state.motion.currentProgress = 0;
      bridge.state.motion.targetProgress = 0;
      bridge.state.motion.velocity = 0;
      bridge.state.motion.initialized = true;
    }

    await api.analyzeText(fixture, 'TAM3720APP-event-navigation-e2e.txt');
    api.applyProcessedRouteToFlightFlow();

    const model = api.getModel();
    model.lastNativeIndex = -1;
    const depIndex = parsed.events.findIndex(event => event.messageType === 'DEP');
    const transferIndex = parsed.events.findIndex(event => event.messageType === 'ACP');
    const terIndex = parsed.events.findIndex(event => /Término/i.test(event.operation));

    return {
      eventCount: parsed.events.length,
      depIndex,
      transferIndex,
      terIndex,
      depTarget: bridge.state.geo.eventRoutes?.[depIndex]?.target,
      transferTarget: bridge.state.geo.eventRoutes?.[transferIndex]?.target,
      terTarget: bridge.state.geo.eventRoutes?.[terIndex]?.target,
    };
  }, APP_DERIVED_FIXTURE);

  expect(setup.eventCount).toBeGreaterThanOrEqual(5);
  expect(setup.depIndex).toBe(1);
  expect(setup.transferIndex).toBeGreaterThan(setup.depIndex);
  expect(setup.terIndex).toBeGreaterThan(setup.transferIndex);
  expect(setup.depTarget).toBe(0);
  expect(setup.transferTarget).toBeGreaterThan(0);
  expect(setup.terTarget).toBeGreaterThan(setup.transferTarget);
  expect(setup.terTarget).toBeLessThan(1);

  await page.locator('#ffrpOpen').click();
  await expect(page.locator('#ffrpModal')).toBeVisible();
  await expect(page.locator('#ffrpEventSelect')).toHaveValue('0');
  await expect(page.locator('#ffrpRange')).toHaveValue('0');
  await expect(page.locator('#ffrpRouteList .ffrp-point.active-point')).toContainText('SBBR');

  await page.locator('#ffrpNextEvent').click();
  await expect.poll(() => page.evaluate(() => window.__FlightFlowFirBridge?.state?.index)).toBe(setup.depIndex);
  await expect(page.locator('#ffrpEventSelect')).toHaveValue(String(setup.depIndex));
  await expect.poll(() => page.evaluate(() => Number(window.__FlightFlowFirBridge?.state?.motion?.targetProgress ?? -1))).toBe(0);
  await expect.poll(() => page.locator('#ffrpRange').evaluate(input => Number(input.value))).toBe(0);
  await expect(page.locator('#ffrpRouteList .ffrp-point.active-point')).toContainText('SBBR');

  await page.locator('#ffrpNextEvent').click();
  await expect.poll(() => page.evaluate(() => window.__FlightFlowFirBridge?.state?.index)).toBe(setup.transferIndex);
  await expect(page.locator('#ffrpEventSelect')).toHaveValue(String(setup.transferIndex));
  await expect.poll(() => page.evaluate(() => Number(window.__FlightFlowFirBridge?.state?.motion?.targetProgress || 0))).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => Number(window.__FlightFlowFirBridge?.state?.motion?.currentProgress || 0)), { timeout: 5000 }).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(expected => {
    const target = Number(window.__FlightFlowFirBridge?.state?.motion?.targetProgress || 0);
    return Math.abs(target - expected);
  }, setup.transferTarget)).toBeLessThan(0.000001);
  await expect.poll(() => page.locator('#ffrpRange').evaluate((input, expected) =>
    Math.abs(Number(input.value) - expected * 1000), setup.transferTarget)).toBeLessThan(2);

  await page.locator('#ffrpEventSelect').selectOption(String(setup.terIndex));
  await expect.poll(() => page.evaluate(() => window.__FlightFlowFirBridge?.state?.index)).toBe(setup.terIndex);
  await expect(page.locator('#ffrpEventSelect')).toHaveValue(String(setup.terIndex));
  await expect.poll(() => page.evaluate(expected => {
    const target = Number(window.__FlightFlowFirBridge?.state?.motion?.targetProgress || 0);
    return Math.abs(target - expected);
  }, setup.terTarget)).toBeLessThan(0.000001);
  await expect.poll(() => page.evaluate(previous => Number(window.__FlightFlowFirBridge?.state?.motion?.currentProgress || 0) - previous, setup.transferTarget), { timeout: 5000 }).toBeGreaterThan(0);
  await expect.poll(() => page.locator('#ffrpRange').evaluate((input, expected) =>
    Math.abs(Number(input.value) - expected * 1000), setup.terTarget)).toBeLessThan(2);
  await expect(page.locator('#ffrpRouteList .ffrp-point.active-point')).not.toContainText('SBBR');

  await page.locator('#ffrpPrevEvent').click();
  await expect.poll(() => page.evaluate(() => window.__FlightFlowFirBridge?.state?.index)).toBe(setup.transferIndex);
  await expect(page.locator('#ffrpEventSelect')).toHaveValue(String(setup.transferIndex));
  await expect.poll(() => page.evaluate(expected => {
    const target = Number(window.__FlightFlowFirBridge?.state?.motion?.targetProgress || 0);
    return Math.abs(target - expected);
  }, setup.transferTarget)).toBeLessThan(0.000001);
  await expect.poll(() => page.evaluate(previous => previous - Number(window.__FlightFlowFirBridge?.state?.motion?.currentProgress || 0), setup.terTarget), { timeout: 5000 }).toBeGreaterThan(0);
  await expect.poll(() => page.locator('#ffrpRange').evaluate((input, expected) =>
    Math.abs(Number(input.value) - expected * 1000), setup.transferTarget)).toBeLessThan(2);

  await expect(page.locator('#ffrpEventInfo')).toContainText(`Evento ${setup.transferIndex + 1}/${setup.eventCount}`);
});


test('PSFBU sem DEP permanece sem movimento ao navegar até o CNL', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'load' });
  await expect.poll(() => page.evaluate(() => Boolean(window.__FlightFlowFirBridge && window.FlightFlowRouteProcessedV7412))).toBe(true);

  await page.locator('#fileInput').setInputFiles({
    name: 'PSFBUAPP-no-dep.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from(APP_NO_EXPANDABLE_ROUTE, 'utf8'),
  });
  await expect(page.locator('#readStartBtn')).toBeEnabled();
  await page.locator('#readStartBtn').click();

  await expect(page.locator('#callsignTitle')).toHaveText('PSFBU');
  await expect(page.locator('#selectedFileLabel')).toContainText('PSFBUAPP-no-dep.txt');
  await expect(page.locator('#scrubber')).toBeEnabled();
  await expect(page.locator('.timeline-item')).toHaveCount(2);
  await expect(page.locator('#frameCounter')).toContainText('1 / 2');
  await expect(page.locator('#scrubber')).toHaveValue('0');

  await expect.poll(() => page.evaluate(() => {
    const state = window.__FlightFlowFirBridge?.state;
    const model = window.FlightFlowRouteProcessedV7412?.getModel?.();
    return {
      index: state?.index,
      currentProgress: Number(state?.motion?.currentProgress || 0),
      targetProgress: Number(state?.motion?.targetProgress || 0),
      velocity: Number(state?.motion?.velocity || 0),
      routeModelLoaded: Boolean(model?.history),
      processedMetadata: Boolean(state?.geo?.ffrpProcessedRoute),
      openHidden: Boolean(document.querySelector('#ffrpOpen')?.hidden),
    };
  })).toEqual({
    index: 0,
    currentProgress: 0,
    targetProgress: 0,
    velocity: 0,
    routeModelLoaded: false,
    processedMetadata: false,
    openHidden: true,
  });

  await page.locator('#nextBtn').click();
  await expect(page.locator('#scrubber')).toHaveValue('1');
  await expect(page.locator('#frameCounter')).toContainText('2 / 2');
  await expect(page.locator('.timeline-item.active')).toHaveAttribute('data-event-index', '1');

  await page.waitForTimeout(500);

  const afterCnl = await page.evaluate(() => {
    const state = window.__FlightFlowFirBridge?.state;
    const model = window.FlightFlowRouteProcessedV7412?.getModel?.();
    return {
      index: state?.index,
      currentProgress: Number(state?.motion?.currentProgress || 0),
      targetProgress: Number(state?.motion?.targetProgress || 0),
      velocity: Number(state?.motion?.velocity || 0),
      messageType: state?.parsed?.events?.[state.index]?.messageType || '',
      hasDep: Boolean(state?.parsed?.events?.some?.(event => event.messageType === 'DEP')),
      routeModelLoaded: Boolean(model?.history),
      processedMetadata: Boolean(state?.geo?.ffrpProcessedRoute),
      openHidden: Boolean(document.querySelector('#ffrpOpen')?.hidden),
    };
  });

  expect(afterCnl.index).toBe(1);
  expect(afterCnl.messageType).toBe('FPVD/CNL');
  expect(afterCnl.hasDep).toBe(false);
  expect(afterCnl.currentProgress).toBe(0);
  expect(afterCnl.targetProgress).toBe(0);
  expect(afterCnl.velocity).toBe(0);
  expect(afterCnl.routeModelLoaded).toBe(false);
  expect(afterCnl.processedMetadata).toBe(false);
  expect(afterCnl.openHidden).toBe(true);
});


test('troca real de APP em movimento para PSFBU sem DEP zera estado espacial anterior', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'load' });
  await expect.poll(() => page.evaluate(() => Boolean(window.__FlightFlowFirBridge && window.FlightFlowRouteProcessedV7412))).toBe(true);

  await page.locator('#fileInput').setInputFiles({
    name: 'TAM3720APP-before-PSFBU.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from(APP_DERIVED_FIXTURE, 'utf8'),
  });
  await expect(page.locator('#readStartBtn')).toBeEnabled();
  await page.locator('#readStartBtn').click();

  await expect(page.locator('#callsignTitle')).toHaveText('TAM3720');
  await expect(page.locator('.timeline-item')).toHaveCount(5);
  await expect.poll(() => page.evaluate(() =>
    Boolean(window.__FlightFlowFirBridge?.state?.geo?.ffrpProcessedRoute)
  )).toBe(true);

  await page.locator('#nextBtn').click();
  await expect(page.locator('#scrubber')).toHaveValue('1');
  await page.locator('#nextBtn').click();
  await expect(page.locator('#scrubber')).toHaveValue('2');

  await expect.poll(() => page.evaluate(() => window.__FlightFlowFirBridge?.state?.index)).toBe(2);

  await expect.poll(() => page.evaluate(() =>
    Number(window.__FlightFlowFirBridge?.state?.motion?.targetProgress || 0)
  )).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() =>
    Number(window.__FlightFlowFirBridge?.state?.motion?.currentProgress || 0)
  ), { timeout: 5000 }).toBeGreaterThan(0);

  await page.locator('#fileInput').setInputFiles({
    name: 'PSFBUAPP-after-moving-plan.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from(APP_NO_EXPANDABLE_ROUTE, 'utf8'),
  });
  await expect(page.locator('#readStartBtn')).toBeEnabled();
  await page.locator('#readStartBtn').click();

  await expect(page.locator('#callsignTitle')).toHaveText('PSFBU');
  await expect(page.locator('.timeline-item')).toHaveCount(2);
  await expect(page.locator('#scrubber')).toHaveValue('0');

  await expect.poll(() => page.evaluate(() => {
    const state = window.__FlightFlowFirBridge?.state;
    const model = window.FlightFlowRouteProcessedV7412?.getModel?.();
    return {
      index: state?.index,
      currentProgress: Number(state?.motion?.currentProgress || 0),
      targetProgress: Number(state?.motion?.targetProgress || 0),
      velocity: Number(state?.motion?.velocity || 0),
      hasDep: Boolean(state?.parsed?.events?.some?.(event => event.messageType === 'DEP')),
      routeModelLoaded: Boolean(model?.history),
      processedMetadata: Boolean(state?.geo?.ffrpProcessedRoute),
      openHidden: Boolean(document.querySelector('#ffrpOpen')?.hidden),
    };
  })).toEqual({
    index: 0,
    currentProgress: 0,
    targetProgress: 0,
    velocity: 0,
    hasDep: false,
    routeModelLoaded: false,
    processedMetadata: false,
    openHidden: true,
  });

  await page.waitForTimeout(500);
  const stable = await page.evaluate(() => {
    const motion = window.__FlightFlowFirBridge?.state?.motion;
    return {
      currentProgress: Number(motion?.currentProgress || 0),
      targetProgress: Number(motion?.targetProgress || 0),
      velocity: Number(motion?.velocity || 0),
    };
  });
  expect(stable).toEqual({ currentProgress: 0, targetProgress: 0, velocity: 0 });
});


test('selecionar novo APP mantém a Rota Processada atual até Ler e iniciar', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'load' });
  await expect.poll(() => page.evaluate(() => Boolean(window.__FlightFlowFirBridge && window.FlightFlowRouteProcessedV7412))).toBe(true);

  await page.locator('#fileInput').setInputFiles({
    name: 'TAM3720APP-current.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from(APP_DERIVED_FIXTURE, 'utf8'),
  });
  await expect(page.locator('#readStartBtn')).toBeEnabled();
  await page.locator('#readStartBtn').click();

  await expect(page.locator('#callsignTitle')).toHaveText('TAM3720');
  await expect.poll(() => page.evaluate(() =>
    window.FlightFlowRouteProcessedV7412?.getModel?.().history?.callsign || ''
  )).toBe('TAM3720');
  await expect(page.locator('#ffrpOpen')).toBeVisible();

  await page.locator('#fileInput').setInputFiles({
    name: 'PSFBUAPP-pending.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from(APP_NO_EXPANDABLE_ROUTE, 'utf8'),
  });

  await expect(page.locator('#selectedFileLabel')).toContainText('PSFBUAPP-pending.txt');
  await expect(page.locator('#readStartBtn')).toBeEnabled();

  await expect(page.locator('#callsignTitle')).toHaveText('TAM3720');
  await expect.poll(() => page.evaluate(() => {
    const state = window.__FlightFlowFirBridge?.state;
    const model = window.FlightFlowRouteProcessedV7412?.getModel?.();
    return {
      routeCallsign: model?.history?.callsign || '',
      routeModelLoaded: Boolean(model?.history),
      processedMetadata: Boolean(state?.geo?.ffrpProcessedRoute),
      openHidden: Boolean(document.querySelector('#ffrpOpen')?.hidden),
    };
  })).toEqual({
    routeCallsign: 'TAM3720',
    routeModelLoaded: true,
    processedMetadata: true,
    openHidden: false,
  });

  await page.locator('#readStartBtn').click();
  await expect(page.locator('#callsignTitle')).toHaveText('PSFBU');
  await expect.poll(() => page.evaluate(() => {
    const state = window.__FlightFlowFirBridge?.state;
    const model = window.FlightFlowRouteProcessedV7412?.getModel?.();
    return {
      routeModelLoaded: Boolean(model?.history),
      processedMetadata: Boolean(state?.geo?.ffrpProcessedRoute),
      openHidden: Boolean(document.querySelector('#ffrpOpen')?.hidden),
    };
  })).toEqual({
    routeModelLoaded: false,
    processedMetadata: false,
    openHidden: true,
  });
});


test('reler o mesmo APP com outro nome reconstrói a Rota Processada', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'load' });
  await expect.poll(() => page.evaluate(() => Boolean(window.__FlightFlowFirBridge && window.FlightFlowRouteProcessedV7412))).toBe(true);

  await page.locator('#fileInput').setInputFiles({
    name: 'TAM3720APP-original.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from(APP_DERIVED_FIXTURE, 'utf8'),
  });
  await page.locator('#readStartBtn').click();

  await expect(page.locator('#callsignTitle')).toHaveText('TAM3720');
  await expect.poll(() => page.evaluate(() =>
    window.FlightFlowRouteProcessedV7412?.getModel?.().history?.callsign || ''
  )).toBe('TAM3720');
  await expect(page.locator('#ffrpOpen')).toBeVisible();

  await page.locator('#fileInput').setInputFiles({
    name: 'TAM3720APP-copia.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from(APP_DERIVED_FIXTURE, 'utf8'),
  });
  await expect(page.locator('#selectedFileLabel')).toContainText('TAM3720APP-copia.txt');
  await page.locator('#readStartBtn').click();

  await expect(page.locator('#callsignTitle')).toHaveText('TAM3720');
  await expect(page.locator('#selectedFileLabel')).toContainText('TAM3720APP-copia.txt');
  await expect.poll(() => page.evaluate(() => {
    const state = window.__FlightFlowFirBridge?.state;
    const model = window.FlightFlowRouteProcessedV7412?.getModel?.();
    return {
      routeCallsign: model?.history?.callsign || '',
      routeModelLoaded: Boolean(model?.history),
      processedMetadata: Boolean(state?.geo?.ffrpProcessedRoute),
      openHidden: Boolean(document.querySelector('#ffrpOpen')?.hidden),
    };
  })).toEqual({
    routeCallsign: 'TAM3720',
    routeModelLoaded: true,
    processedMetadata: true,
    openHidden: false,
  });
});


test('APP atual continua navegável enquanto novo arquivo aguarda Ler e iniciar', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'load' });
  await expect.poll(() => page.evaluate(() => Boolean(window.__FlightFlowFirBridge && window.FlightFlowRouteProcessedV7412))).toBe(true);

  await page.locator('#fileInput').setInputFiles({
    name: 'TAM3720APP-active.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from(APP_DERIVED_FIXTURE, 'utf8'),
  });
  await page.locator('#readStartBtn').click();
  await expect(page.locator('#callsignTitle')).toHaveText('TAM3720');

  await page.locator('#nextBtn').click();
  await page.locator('#nextBtn').click();
  await expect.poll(() => page.evaluate(() => window.__FlightFlowFirBridge?.state?.index)).toBe(2);
  await expect.poll(() => page.evaluate(() =>
    Number(window.__FlightFlowFirBridge?.state?.motion?.targetProgress || 0)
  )).toBeGreaterThan(0);

  await page.locator('#fileInput').setInputFiles({
    name: 'PSFBUAPP-pending-navigation.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from(APP_NO_EXPANDABLE_ROUTE, 'utf8'),
  });
  await expect(page.locator('#selectedFileLabel')).toContainText('PSFBUAPP-pending-navigation.txt');
  await expect(page.locator('#callsignTitle')).toHaveText('TAM3720');
  await expect(page.locator('#ffrpOpen')).toBeVisible();

  await page.locator('#prevBtn').click();
  await expect.poll(() => page.evaluate(() => window.__FlightFlowFirBridge?.state?.index)).toBe(1);
  await expect.poll(() => page.evaluate(() =>
    Number(window.__FlightFlowFirBridge?.state?.motion?.targetProgress ?? -1)
  )).toBe(0);

  await expect.poll(() => page.evaluate(() => ({
    routeCallsign: window.FlightFlowRouteProcessedV7412?.getModel?.().history?.callsign || '',
    processedMetadata: Boolean(window.__FlightFlowFirBridge?.state?.geo?.ffrpProcessedRoute),
  }))).toEqual({
    routeCallsign: 'TAM3720',
    processedMetadata: true,
  });

  await page.locator('#nextBtn').click();
  await expect.poll(() => page.evaluate(() => window.__FlightFlowFirBridge?.state?.index)).toBe(2);
  await expect.poll(() => page.evaluate(() =>
    Number(window.__FlightFlowFirBridge?.state?.motion?.targetProgress || 0)
  )).toBeGreaterThan(0);
  await expect(page.locator('#callsignTitle')).toHaveText('TAM3720');
});


test('teclado mantém APP atual navegável durante seleção pendente', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'load' });
  await expect.poll(() => page.evaluate(() => Boolean(window.__FlightFlowFirBridge && window.FlightFlowRouteProcessedV7412))).toBe(true);

  await page.locator('#fileInput').setInputFiles({
    name: 'TAM3720APP-active-keyboard.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from(APP_DERIVED_FIXTURE, 'utf8'),
  });
  await page.locator('#readStartBtn').click();
  await expect(page.locator('#callsignTitle')).toHaveText('TAM3720');

  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => page.evaluate(() => window.__FlightFlowFirBridge?.state?.index)).toBe(2);
  await expect.poll(() => page.evaluate(() =>
    Number(window.__FlightFlowFirBridge?.state?.motion?.targetProgress || 0)
  )).toBeGreaterThan(0);

  await page.locator('#fileInput').setInputFiles({
    name: 'PSFBUAPP-pending-keyboard.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from(APP_NO_EXPANDABLE_ROUTE, 'utf8'),
  });
  await expect(page.locator('#selectedFileLabel')).toContainText('PSFBUAPP-pending-keyboard.txt');
  await expect(page.locator('#callsignTitle')).toHaveText('TAM3720');

  await page.keyboard.press('ArrowLeft');
  await expect.poll(() => page.evaluate(() => window.__FlightFlowFirBridge?.state?.index)).toBe(1);
  await expect.poll(() => page.evaluate(() =>
    Number(window.__FlightFlowFirBridge?.state?.motion?.targetProgress ?? -1)
  )).toBe(0);

  await page.keyboard.press('ArrowRight');
  await expect.poll(() => page.evaluate(() => window.__FlightFlowFirBridge?.state?.index)).toBe(2);
  await expect.poll(() => page.evaluate(() =>
    Number(window.__FlightFlowFirBridge?.state?.motion?.targetProgress || 0)
  )).toBeGreaterThan(0);

  await expect.poll(() => page.evaluate(() => ({
    routeCallsign: window.FlightFlowRouteProcessedV7412?.getModel?.().history?.callsign || '',
    processedMetadata: Boolean(window.__FlightFlowFirBridge?.state?.geo?.ffrpProcessedRoute),
  }))).toEqual({
    routeCallsign: 'TAM3720',
    processedMetadata: true,
  });
});


test('timeline e scrubber mantêm APP atual navegável durante seleção pendente', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'load' });
  await expect.poll(() => page.evaluate(() => Boolean(window.__FlightFlowFirBridge && window.FlightFlowRouteProcessedV7412))).toBe(true);

  await page.locator('#fileInput').setInputFiles({
    name: 'TAM3720APP-active-timeline.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from(APP_DERIVED_FIXTURE, 'utf8'),
  });
  await page.locator('#readStartBtn').click();
  await expect(page.locator('#callsignTitle')).toHaveText('TAM3720');
  await expect(page.locator('.timeline-item')).toHaveCount(5);

  await page.locator('#nextBtn').click();
  await page.locator('#nextBtn').click();
  await expect.poll(() => page.evaluate(() => window.__FlightFlowFirBridge?.state?.index)).toBe(2);
  await expect.poll(() => page.evaluate(() =>
    Number(window.__FlightFlowFirBridge?.state?.motion?.targetProgress || 0)
  )).toBeGreaterThan(0);

  await page.locator('#fileInput').setInputFiles({
    name: 'PSFBUAPP-pending-timeline.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from(APP_NO_EXPANDABLE_ROUTE, 'utf8'),
  });
  await expect(page.locator('#selectedFileLabel')).toContainText('PSFBUAPP-pending-timeline.txt');
  await expect(page.locator('#callsignTitle')).toHaveText('TAM3720');

  await page.locator('.tab[data-tab="timeline"]').click();
  await expect(page.locator('[data-panel="timeline"]')).toHaveClass(/active/);
  await page.locator('.timeline-item[data-event-index="1"]').click();

  await expect.poll(() => page.evaluate(() => window.__FlightFlowFirBridge?.state?.index)).toBe(1);
  await expect(page.locator('#scrubber')).toHaveValue('1');
  await expect.poll(() => page.evaluate(() =>
    Number(window.__FlightFlowFirBridge?.state?.motion?.targetProgress ?? -1)
  )).toBe(0);

  await page.locator('#scrubber').evaluate(input => {
    input.value = '2';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });

  await expect.poll(() => page.evaluate(() => window.__FlightFlowFirBridge?.state?.index)).toBe(2);
  await expect(page.locator('.timeline-item.active')).toHaveAttribute('data-event-index', '2');
  await expect.poll(() => page.evaluate(() =>
    Number(window.__FlightFlowFirBridge?.state?.motion?.targetProgress || 0)
  )).toBeGreaterThan(0);

  await expect.poll(() => page.evaluate(() => ({
    routeCallsign: window.FlightFlowRouteProcessedV7412?.getModel?.().history?.callsign || '',
    processedMetadata: Boolean(window.__FlightFlowFirBridge?.state?.geo?.ffrpProcessedRoute),
  }))).toEqual({
    routeCallsign: 'TAM3720',
    processedMetadata: true,
  });
});


test('autoplay mantém APP atual navegável durante seleção pendente', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'load' });
  await expect.poll(() => page.evaluate(() => Boolean(window.__FlightFlowFirBridge && window.FlightFlowRouteProcessedV7412))).toBe(true);

  await page.locator('#fileInput').setInputFiles({
    name: 'TAM3720APP-active-autoplay.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from(APP_DERIVED_FIXTURE, 'utf8'),
  });
  await page.locator('#readStartBtn').click();
  await expect(page.locator('#callsignTitle')).toHaveText('TAM3720');
  await expect(page.locator('.timeline-item')).toHaveCount(5);

  await page.locator('#nextBtn').click();
  await expect.poll(() => page.evaluate(() => window.__FlightFlowFirBridge?.state?.index)).toBe(1);

  await page.locator('#fileInput').setInputFiles({
    name: 'PSFBUAPP-pending-autoplay.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from(APP_NO_EXPANDABLE_ROUTE, 'utf8'),
  });
  await expect(page.locator('#selectedFileLabel')).toContainText('PSFBUAPP-pending-autoplay.txt');
  await expect(page.locator('#callsignTitle')).toHaveText('TAM3720');

  await page.locator('#speedSelect').selectOption('1');
  await page.locator('#playBtn').click();

  await expect.poll(() => page.evaluate(() => window.__FlightFlowFirBridge?.state?.index), { timeout: 3500 })
    .toBeGreaterThan(1);
  await expect.poll(() => page.evaluate(() =>
    Number(window.__FlightFlowFirBridge?.state?.motion?.targetProgress || 0)
  )).toBeGreaterThan(0);

  await expect.poll(() => page.evaluate(() => ({
    routeCallsign: window.FlightFlowRouteProcessedV7412?.getModel?.().history?.callsign || '',
    processedMetadata: Boolean(window.__FlightFlowFirBridge?.state?.geo?.ffrpProcessedRoute),
  }))).toEqual({
    routeCallsign: 'TAM3720',
    processedMetadata: true,
  });
});
