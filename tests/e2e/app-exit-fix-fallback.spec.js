const { test, expect } = require('@playwright/test');

const GLO7634_APP = String.raw`
Indicativo do plano: GLO7634
ADEP: SBBR
ADES: KMCO
EOBT: 1215

############################################################
OPERAÇÃO : Criação por Mensagem Automática (TTY)
data: 09/07/2026 hora: 11:55:04 posição: SPA01 ambiente: OpA
Estado: PRE Setor anterior: NUL NUL atual: DN NUL NUL seguinte: DN NUL NUL
Indicativo       : GLO7634
Tipo de aeronave : B38M
Velocidade       : N0465
ADEP             : SBBR
ADES             : KMCO
Fixo Chegada     :          ETO Chegada   :         FL Chegada :
Fixo Saída       : MILIX    ETO Saída     : 09-1225 FL Saída   : 340
IDPLANO          : O8LV86WS
Rota             : DCT UGUGA UM409 KIGER/N0462F360 UM409 VUMPI/N0462F360 UL795 DANVO/N0455F380 UL795 GELOG UL210 BORDO Y259 OCTAL DCT

############################################################
OPERAÇÃO : Recepção de Mensagem DEP
data: 09/07/2026 hora: 12:27:35 posição: SPA01 ambiente: OpA
Estado: ATV Setor anterior: NUL NUL atual: DN REC NUL seguinte: DN REC NUL
Conteúdo :
(DEPSBBR/SBBR049-GLO7634-SBBR1227-KMCO-DOF/260709)

############################################################
OPERAÇÃO : Recepção de Mensagem ACP
data: 09/07/2026 hora: 12:33:22 posição: SPA01 ambiente: OpA
Estado: TRF Setor anterior: T1 NUL NUL atual: T1 NUL NUL seguinte: BS NUL NUL
Conteúdo :
(ACPSBBS/SBBR069-GLO7634/A4045-SBBR-KMCO)

############################################################
OPERAÇÃO : Evento Automático de Término
data: 09/07/2026 hora: 12:44:04 posição: SPA01 ambiente: OpA
Estado: TER Setor anterior: T1 NUL NUL atual: T1 NUL NUL seguinte: BS NUL NUL

############################################################
OPERAÇÃO : Evento Automático de Arquivamento
data: 10/07/2026 hora: 00:44:43 posição: SPA01 ambiente: OpA
Estado: ARQ Setor anterior: T1 NUL NUL atual: T1 NUL NUL seguinte: BS NUL NUL
`;

test('APP complexo usa Fixo Saída como limite operacional e não traça linha até ADES remoto', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'load' });
  await expect.poll(() => page.evaluate(() => Boolean(window.FlightFlowRouteProcessedV7412 && window.FlightParser))).toBe(true);

  const setup = await page.evaluate(async fixture => {
    const api = window.FlightFlowRouteProcessedV7412;
    const bridge = window.__FlightFlowFirBridge;
    const parsed = window.FlightParser.parseHistoryText(fixture, { includeRawText: true });
    bridge.state.parsed = parsed;
    bridge.state.index = 0;
    bridge.state.geo.eventRoutes = [];

    await api.analyzeText(fixture, 'GLO7634APP-fixture.txt');
    const model = api.getModel();
    const snapshot = model.resolvedSnapshots[0];
    const depIndex = parsed.events.findIndex(event => event.messageType === 'DEP');
    const acpIndex = parsed.events.findIndex(event => event.messageType === 'ACP');
    const terIndex = parsed.events.findIndex(event => /Término/i.test(event.operation));

    bridge.state.index = acpIndex;
    api.applyProcessedRouteToFlightFlow();

    return {
      ids: snapshot?.points?.map(point => point.ident) || [],
      boundary: Boolean(snapshot?.jurisdictionBoundaryFallback),
      exitFix: model.history?.appExitFix || '',
      exitEto: model.history?.appExitEto || '',
      profileMode: model.movementProfile?.mode || '',
      depTarget: model.movementProfile?.targets?.[depIndex],
      acpTarget: model.movementProfile?.targets?.[acpIndex],
      terTarget: model.movementProfile?.targets?.[terIndex],
      movementIds: api.movementPointsForProfile(snapshot).map(point => point.ident),
      routeTarget: bridge.state.geo.eventRoutes?.[acpIndex]?.target,
    };
  }, GLO7634_APP);

  expect(setup.ids).toEqual(['SBBR', 'MILIX']);
  expect(setup.boundary).toBe(true);
  expect(setup.exitFix).toBe('MILIX');
  expect(setup.exitEto).toBe('09-1225');
  expect(setup.profileMode).toBe('derived');
  expect(setup.depTarget).toBe(0);
  expect(setup.acpTarget).toBeGreaterThan(0);
  expect(setup.acpTarget).toBeLessThan(1);
  expect(setup.terTarget).toBe(1);
  expect(setup.movementIds).toEqual(['SBBR', 'MILIX']);
  expect(setup.routeTarget).toBe(setup.acpTarget);

  await page.locator('#ffrpOpen').click();
  await expect(page.locator('#ffrpModal')).toBeVisible();
  await expect(page.locator('#ffrpRouteList .ffrp-point')).toHaveCount(2);
  await expect(page.locator('#ffrpRouteList')).toContainText('MILIX');
  await expect(page.locator('#ffrpRouteList')).toContainText('FIXO SAÍDA');
  await expect(page.locator('#ffrpRouteList')).toContainText('ETO 09-1225');
  await expect(page.locator('#ffrpRouteList')).not.toContainText('ETIM 09-1225');
  await expect(page.locator('#ffrpRouteList')).not.toContainText('KMCO');
  await expect(page.locator('#ffrpMap')).toContainText('MILIX');
  await expect(page.locator('#ffrpMap')).not.toContainText('KMCO');
  await expect(page.locator('#ffrpMapNote')).toContainText('Fixo Saída MILIX');
  await expect(page.locator('#ffrpMapNote')).toContainText('não é convertido em ETIM');
});


test('Fixo Saída APP limita também a rota exibida no mapa principal', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'load' });
  await expect.poll(() => page.evaluate(() => Boolean(window.FlightFlowRouteProcessedV7412 && window.FlightParser))).toBe(true);

  const visual = await page.evaluate(async fixture => {
    const api = window.FlightFlowRouteProcessedV7412;
    const bridge = window.__FlightFlowFirBridge;
    const parsed = window.FlightParser.parseHistoryText(fixture, { includeRawText: true });
    bridge.state.parsed = parsed;
    bridge.state.index = parsed.events.findIndex(event => event.messageType === 'ACP');
    bridge.state.geo.eventRoutes = [];

    await api.analyzeText(fixture, 'GLO7634APP-main-map-fixture.txt');
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
      movementIds: api.movementPointsForProfile(model.resolvedSnapshots[0]).map(point => point.ident),
    };
  }, GLO7634_APP);

  expect(visual.routeCount).toBeGreaterThanOrEqual(1);
  expect(visual.fixCount).toBeGreaterThanOrEqual(2);
  expect(visual.movementIds).toEqual(['SBBR', 'MILIX']);
  expect(visual.text).toContain('SBBR');
  expect(visual.text).toContain('MILIX');
  expect(visual.text).not.toContain('KMCO');
  expect(visual.labels.some(label => label.includes('MILIX'))).toBe(true);
  expect(visual.labels.some(label => label.includes('KMCO'))).toBe(false);
});
