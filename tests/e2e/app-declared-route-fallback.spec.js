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
  .replace('Indicativo       : TAM3720\\nADEP', 'Indicativo       : TAM3720\\nVelocidade       : N0450\\nADEP')
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
