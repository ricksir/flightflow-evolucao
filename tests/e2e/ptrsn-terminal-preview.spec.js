const { test, expect } = require('@playwright/test');

const PTRSN_FIXTURE = String.raw`
Indicativo do plano: PTRSN
ADEP: SWGI
ADES: SNQE
Regra: V
Velocidade: N0150
Nível: F095
Rota : DCT 1101S04913W
       DCT 0947S04922W
       DCT 0832S04931W
       DCT 0718S04941W
       DCT

############################################################
OPERAÇÃO : Recepção de Mensagem ATS
data:   30/09/2026      hora:   13:30:00      posição: 14F      ambiente: OpA
Estado: ATV Setor anterior: NUL NUL atual: 14F NUL NUL seguinte: AZ NUL NUL
PONTOS : SWGI        1101S04913W 1015S04918W
ETIM   : 30-13:30    30-13:51    30-14:09
CFL    : F095        F095         F095
############################################################

############################################################
OPERAÇÃO : Ordem TER
data:   30/09/2026      hora:   14:52:14      posição: AZ       ambiente: OpA
Estado: TER Setor anterior: 14F atual: AZ seguinte: NUL
############################################################

############################################################
OPERAÇÃO : ARQ
data:   30/09/2026      hora:   16:27:26      posição: AZ       ambiente: OpA
Estado: ARQ Setor anterior: 14F atual: AZ seguinte: NUL
############################################################
`;

async function loadDemo(page) {
  await page.goto('/index.html', { waitUntil: 'load' });
  const overlayDemo = page.locator('#overlayDemoBtn');
  if (await overlayDemo.isVisible()) await overlayDemo.click();
  else await page.locator('#demoBtn').click();

  await expect(page.locator('#scrubber')).toBeEnabled();
  await expect(page.locator('.timeline-item')).not.toHaveCount(0);
  await expect(page.locator('#playBtn')).toHaveAttribute('title', /Pausar/, { timeout: 5_000 });
  await page.locator('#restartBtn').click();
  await expect(page.locator('#playBtn')).toHaveAttribute('title', /Reproduzir/);
}

test('PTRSN liga a continuação declarada 0718S04941W ao ADES SNQE nas duas visualizações sem criar ETIM', async ({ page }) => {
  await loadDemo(page);

  const setup = await page.evaluate(async fixture => {
    const api = window.FlightFlowRouteProcessedV7412;
    const bridge = window.__FlightFlowFirBridge;
    if (!api || !bridge?.state?.parsed?.events?.length) throw new Error('FlightFlow/rota não inicializados');

    const model = api.getModel();
    if (model.passiveTimer) clearInterval(model.passiveTimer);
    model.passiveTimer = null;
    model.passiveBusy = true;

    const events = bridge.state.parsed.events;
    const terIndex = Math.max(2, events.length - 2);
    const stripTer = value => String(value || '').replace(/ORDEM\s+TER/gi, 'EVENTO FINAL');

    events.forEach((event, index) => {
      if (index === terIndex) return;
      event.operation = stripTer(event.operation);
      event.rawBlock = stripTer(event.rawBlock);
      event.content = stripTer(event.content);
      event.messageType = stripTer(event.messageType);
    });

    events[terIndex].operation = 'Ordem TER';
    events[terIndex].rawBlock = 'OPERAÇÃO : Ordem TER\nPlano encerrado por Ordem TER';
    events[terIndex].content = 'Ordem TER';
    events[terIndex].messageType = 'TER';

    await api.analyzeText(fixture, 'PTRSN_SWGI-1330.txt');
    api.jumpToFlightEvent(terIndex - 1, { snap: true });
    await new Promise(resolve => setTimeout(resolve, 80));
    api.applyProcessedRouteToFlightFlow();

    const snapshot = model.resolvedSnapshots.at(-1);
    const continuation = api.declaredRouteContinuation(snapshot);
    const terminal = api.terminalClosureState(snapshot, terIndex - 1);
    const profile = model.movementProfile;
    const preTerTarget = Number(profile?.targets?.[terIndex - 1]);

    return {
      terIndex,
      historical: snapshot.points.map(point => point.ident),
      continuation: continuation.map(point => ({
        ident: point.ident,
        etim: point.etim,
        etimKey: point.etimKey,
        cfl: point.cfl,
        declared: point.declared,
        untimed: point.untimed,
      })),
      terminalVisible: terminal.visible,
      terminalActive: terminal.active,
      terminalFrom: terminal.from?.ident || null,
      terminalDestination: terminal.destination?.ident || null,
      terminalEtim: terminal.destination?.etim ?? null,
      terminalStar: terminal.destination?.star ?? null,
      preTerTarget,
      timedLimit: api.timedProgressLimit(snapshot),
    };
  }, PTRSN_FIXTURE);

  expect(setup.historical).toEqual(['SWGI', '1101S04913W', '1015S04918W']);
  expect(setup.continuation.map(point => point.ident)).toEqual([
    '0947S04922W',
    '0832S04931W',
    '0718S04941W',
  ]);
  expect(setup.continuation.every(point => point.declared && point.untimed)).toBe(true);
  expect(setup.continuation.every(point => point.etim === '' && point.etimKey === null && point.cfl === '')).toBe(true);

  expect(setup.terminalVisible).toBe(true);
  expect(setup.terminalActive).toBe(false);
  expect(setup.terminalFrom).toBe('0718S04941W');
  expect(setup.terminalDestination).toBe('SNQE');
  expect(setup.terminalEtim).toBe('');
  expect(setup.terminalStar).toBeNull();
  expect(setup.preTerTarget).toBeLessThan(1);
  expect(setup.preTerTarget).toBeLessThanOrEqual(setup.timedLimit + 1e-9);

  await expect.poll(() => page.evaluate(() => Number(window.__FlightFlowFirBridge?.state?.index ?? -1))).toBe(setup.terIndex - 1);

  const nativeVisual = await page.evaluate(() => {
    const api = window.FlightFlowRouteProcessedV7412;
    const applied = api?.applyProcessedRouteToFlightFlow() ?? false;
    const model = api?.getModel?.();
    const profileSnapshot = model?.movementProfile?.snapshot || model?.resolvedSnapshots?.at?.(-1) || null;
    const terminal = profileSnapshot ? api?.terminalClosureState?.(profileSnapshot) : null;
    const engine = window.__FlightFlowFirBridge?.realMapState?.engine || 'none';

    const nativeLayers = model?.nativeMapLayer?.getLayers?.() || [];
    const leafletLine = nativeLayers.find(layer =>
      String(layer?.options?.className || '').includes('ffrp-native-terminal-route')
      && String(layer?.options?.className || '').includes('ffrp-native-terminal-preview')
    ) || null;
    const leafletUnderlay = nativeLayers.find(layer =>
      String(layer?.options?.className || '').includes('ffrp-native-terminal-underlay')
      && String(layer?.options?.className || '').includes('ffrp-native-terminal-preview')
    ) || null;

    const vectorLine = document.querySelector('#ffrpVectorFixLayer .ffrp-vroute-terminal.pending[data-terminal-state="preview"]');
    const vectorUnderlay = document.querySelector('#ffrpVectorFixLayer .ffrp-vroute-terminal-underlay.pending[data-terminal-state="preview"]');

    const leafletLatLngs = leafletLine?.getLatLngs?.() || [];
    const eq = (a, b) => Number.isFinite(Number(a)) && Number.isFinite(Number(b)) && Math.abs(Number(a) - Number(b)) < 1e-8;
    const leafletStartMatches = Boolean(
      leafletLatLngs[0] && terminal?.from?.geo
      && eq(leafletLatLngs[0].lat, terminal.from.geo.lat)
      && eq(leafletLatLngs[0].lng, terminal.from.geo.lon)
    );
    const leafletEndMatches = Boolean(
      leafletLatLngs[1] && terminal?.destination?.geo
      && eq(leafletLatLngs[1].lat, terminal.destination.geo.lat)
      && eq(leafletLatLngs[1].lng, terminal.destination.geo.lon)
    );

    const vectorStyle = vectorLine ? getComputedStyle(vectorLine) : null;
    const lineCount = Number(Boolean(leafletLine)) + Number(Boolean(vectorLine));
    const underlayCount = Number(Boolean(leafletUnderlay)) + Number(Boolean(vectorUnderlay));

    return {
      applied,
      engine,
      terminalVisible: Boolean(terminal?.visible),
      terminalActive: Boolean(terminal?.active),
      terminalFrom: terminal?.from?.ident || null,
      terminalDestination: terminal?.destination?.ident || null,
      lineCount,
      underlayCount,
      dash: leafletLine?.options?.dashArray
        || vectorStyle?.strokeDasharray
        || vectorLine?.getAttribute?.('stroke-dasharray')
        || '',
      startMatches: leafletLine ? leafletStartMatches : Boolean(vectorLine),
      endpointMatches: leafletLine ? leafletEndMatches : Boolean(vectorLine),
      from: leafletLine ? (terminal?.from?.ident || null) : (vectorLine?.getAttribute('data-terminal-from') || null),
      destination: leafletLine ? (terminal?.destination?.ident || null) : (vectorLine?.getAttribute('data-terminal-destination') || null),
      state: leafletLine ? (terminal?.active ? 'active' : 'preview') : (vectorLine?.getAttribute('data-terminal-state') || null),
    };
  });
  expect(nativeVisual.applied).toBe(true);
  expect(['leaflet', 'vector']).toContain(nativeVisual.engine);
  expect(nativeVisual.terminalVisible).toBe(true);
  expect(nativeVisual.terminalActive).toBe(false);
  expect(nativeVisual.lineCount).toBe(1);
  expect(nativeVisual.underlayCount).toBe(1);
  expect(nativeVisual.dash).not.toBe('');
  expect(nativeVisual.dash).not.toBe('none');
  expect(nativeVisual.from).toBe('0718S04941W');
  expect(nativeVisual.destination).toBe('SNQE');
  expect(nativeVisual.state).toBe('preview');
  expect(nativeVisual.startMatches).toBe(true);
  expect(nativeVisual.endpointMatches).toBe(true);

  await page.locator('#ffrpOpen').evaluate(button => button.click());
  await expect(page.locator('#ffrpModal')).toBeVisible();

  await expect(page.locator('#ffrpRouteList .ffrp-point')).toHaveCount(7);
  const cards = page.locator('#ffrpRouteList .ffrp-point');
  await expect(cards.nth(0)).toContainText('SWGI');
  await expect(cards.nth(1)).toContainText('1101S04913W');
  await expect(cards.nth(2)).toContainText('1015S04918W');
  await expect(cards.nth(3)).toContainText('0947S04922W');
  await expect(cards.nth(3)).toContainText('DECLARADA');
  await expect(cards.nth(3)).toContainText('SEM ETIM');
  await expect(cards.nth(4)).toContainText('0832S04931W');
  await expect(cards.nth(5)).toContainText('0718S04941W');
  await expect(cards.nth(6)).toContainText('SNQE');
  await expect(cards.nth(6)).toContainText('ADES');

  const modalVisual = await page.evaluate(() => {
    const line = document.querySelector('#ffrpMap .route-terminal');
    const destination = document.querySelector('#ffrpMap .wp.destination circle');
    const declared = Array.from(document.querySelectorAll('#ffrpMap .wp.declared circle')).at(-1);
    const style = line ? getComputedStyle(line) : null;
    const n = (node, attr) => node ? Number(node.getAttribute(attr)) : null;
    const eq = (a, b) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < 1e-9;

    return {
      lineCount: document.querySelectorAll('#ffrpMap .route-terminal').length,
      underlayCount: document.querySelectorAll('#ffrpMap .route-terminal-underlay').length,
      from: line?.getAttribute('data-terminal-from') || null,
      destination: line?.getAttribute('data-terminal-destination') || null,
      state: line?.getAttribute('data-terminal-state') || null,
      etim: line?.getAttribute('data-etim') ?? null,
      cfl: line?.getAttribute('data-cfl') ?? null,
      star: line?.getAttribute('data-star') ?? null,
      dash: style?.strokeDasharray || '',
      startMatches: Boolean(line && declared)
        && eq(n(line, 'x1'), n(declared, 'cx'))
        && eq(n(line, 'y1'), n(declared, 'cy')),
      endpointMatches: Boolean(line && destination)
        && eq(n(line, 'x2'), n(destination, 'cx'))
        && eq(n(line, 'y2'), n(destination, 'cy')),
    };
  });

  expect(modalVisual.lineCount).toBe(1);
  expect(modalVisual.underlayCount).toBe(1);
  expect(modalVisual.from).toBe('0718S04941W');
  expect(modalVisual.destination).toBe('SNQE');
  expect(modalVisual.state).toBe('preview');
  expect(modalVisual.etim).toBe('');
  expect(modalVisual.cfl).toBe('');
  expect(modalVisual.star).toBe('');
  expect(modalVisual.dash).not.toBe('');
  expect(modalVisual.dash).not.toBe('none');
  expect(modalVisual.startMatches).toBe(true);
  expect(modalVisual.endpointMatches).toBe(true);

  await expect(page.locator('#ffrpTailNote')).toContainText('Fechamento terminal previsto');
  await expect(page.locator('#ffrpTailNote')).toContainText('0718S04941W');
  await expect(page.locator('#ffrpTailNote')).toContainText('SNQE');
  await expect(page.locator('#ffrpTailNote')).toContainText('não percorre esse trecho');
});
