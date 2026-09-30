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

test('PTRSN usa somente o marcador base SNQE · ADES no mapa principal', async ({ page }) => {
  await loadDemo(page);

  const result = await page.evaluate(async fixture => {
    const api = window.FlightFlowRouteProcessedV7412;
    const bridge = window.__FlightFlowFirBridge;
    if (!api || !bridge?.state?.parsed?.events?.length) throw new Error('FlightFlow/rota não inicializados');

    const model = api.getModel();
    if (model.passiveTimer) clearInterval(model.passiveTimer);
    model.passiveTimer = null;
    model.passiveBusy = true;

    await api.analyzeText(fixture, 'PTRSN_SWGI-1330.txt');
    await new Promise(resolve => setTimeout(resolve, 80));

    const host = document.querySelector('#realMap') || document.body;
    const fake = document.createElement('div');
    fake.id = 'ptrsnBaseAdesFixture';
    fake.innerHTML = '<div class="ff-airport-marker ades"><span class="ff-airport-dot"></span><span class="ff-airport-text">SNQE · ADES</span></div>';
    host.appendChild(fake);

    model.fixesVisible = true;
    api.applyProcessedRouteToFlightFlow();

    const snapshot = model.resolvedSnapshots.at(-1);
    const continuation = api.declaredRouteContinuation(snapshot);

    const baseLabels = Array.from(document.querySelectorAll('.ff-airport-marker.ades .ff-airport-text'))
      .filter(el => /^SNQE\b/.test(String(el.textContent || '').trim()))
      .map(el => String(el.textContent || '').trim());

    const routeLayers = model.nativeFixLayer?.getLayers?.() || [];
    const routeSnqe = routeLayers.filter(layer => {
      const content = String(layer?.getTooltip?.()?.getContent?.() || '');
      return /\bSNQE\b/.test(content);
    });

    const routeLayerIdents = routeLayers.map(layer => String(layer?.getTooltip?.()?.getContent?.() || ''));

    return {
      engine: bridge?.realMapState?.engine || 'none',
      historical: snapshot.points.map(point => point.ident),
      continuation: continuation.map(point => point.ident),
      baseLabels,
      routeFixLayerCount: routeLayers.length,
      routeSnqeCount: routeSnqe.length,
      routeLayerIdents,
    };
  }, PTRSN_FIXTURE);

  expect(result.engine).toBe('leaflet');
  expect(result.historical).toEqual(['SWGI', '1101S04913W', '1015S04918W']);
  expect(result.continuation).toEqual(['0947S04922W', '0832S04931W', '0718S04941W']);
  expect(result.baseLabels).toEqual(['SNQE · ADES']);
  expect(result.routeFixLayerCount).toBe(6);
  expect(result.routeSnqeCount, JSON.stringify(result.routeLayerIdents, null, 2)).toBe(0);

  await page.locator('#ffrpOpen').evaluate(button => button.click());
  await expect(page.locator('#ffrpModal')).toBeVisible();
  await expect(page.locator('#ffrpRouteList .ffrp-point')).toHaveCount(7);
  await expect(page.locator('#ffrpRouteList .ffrp-point').last()).toContainText('SNQE');
  await expect(page.locator('#ffrpRouteList .ffrp-point').last()).toContainText('ADES');
});
