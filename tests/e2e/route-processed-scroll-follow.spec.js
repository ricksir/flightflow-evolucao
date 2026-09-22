const { test, expect } = require('@playwright/test');

const ROUTE_FIXTURE = String.raw`
Indicativo do plano: TAM3774
ADEP: SBBR
ADES: SBCT
Rota: KUKOL UZ5 UMGUL

############################################################
OPERAÇÃO : Criação pelo Arquivo de RPL
data:   08/07/2026      hora:   18:00:34      posição: SPA01      ambiente: OpA

PONTOS : SBBR        UMSUB       KUKOL       SIRUL       VUDOT       EDMIN
CFL/IFL: 340         340         340         340         340         340
ETIM   : 08-23:45    08-23:50    08-23:55    09-00:04    09-00:09    09-00:11

PONTOS : 1853S04832W UDIGI       MEVIK       ASTOB       VUPOG       UPONA
CFL/IFL: 340         340         340         340         340         340
ETIM   : 09-00:13    09-00:16    09-00:25    09-00:28    09-00:28    09-00:32

PONTOS : 2127S04856W ISISA       ENPEG       PALCA       ANSOK       IMTBI
CFL/IFL: 340         340         340         340         340         340
ETIM   : 09-00:34    09-00:36    09-00:36    09-00:39    09-00:42    09-00:43
############################################################
`;

async function loadDemo(page) {
  await page.goto('/index.html', { waitUntil: 'load' });
  const overlayDemo = page.locator('#overlayDemoBtn');
  if (await overlayDemo.isVisible()) await overlayDemo.click();
  else await page.locator('#demoBtn').click();

  await expect(page.locator('#scrubber')).toBeEnabled();
  await expect(page.locator('.timeline-item')).not.toHaveCount(0);
  await page.locator('#restartBtn').click();
}

test('Rota Processada acompanha o waypoint atual no scroll ao avançar pelas setas', async ({ page }) => {
  await loadDemo(page);

  const setup = await page.evaluate(async fixture => {
    const api = window.FlightFlowRouteProcessedV7412;
    const bridge = window.__FlightFlowFirBridge;
    if (!api || !bridge?.state?.parsed?.events?.length) throw new Error('FlightFlow/rota não inicializados');

    await api.analyzeText(fixture, 'scroll-follow-route.txt');

    const model = api.getModel();
    if (model.passiveTimer) clearInterval(model.passiveTimer);
    model.passiveTimer = null;
    model.passiveBusy = true;

    const total = bridge.state.parsed.events.length;
    const baseProfile = model.movementProfile || api.buildMovementProfile();
    model.movementProfile = {
      ...baseProfile,
      targets: Array.from({ length: total }, (_, index) =>
        total > 1 ? index / (total - 1) : 0),
    };

    const snapshot = model.resolvedSnapshots.at(-1);
    let targetEvent = total - 1;
    let targetPoint = 0;

    for (let index = 0; index < total; index += 1) {
      const progress = api.progressForNativeEventIndex(index, total);
      const context = api.routeDisplayContext(snapshot, progress);
      if (context.focusPlotIndex >= 7) {
        targetEvent = index;
        targetPoint = context.focusPlotIndex;
        break;
      }
    }

    const progress = api.progressForNativeEventIndex(targetEvent, total);
    api.jumpToFlightEvent(0);
    return { total, targetEvent, targetPoint, progress };
  }, ROUTE_FIXTURE);

  expect(setup.targetEvent).toBeGreaterThan(0);
  expect(setup.targetPoint).toBeGreaterThanOrEqual(7);

  await page.locator('#ffrpOpen').evaluate(button => button.click());
  await expect(page.locator('#ffrpModal')).toBeVisible();
  await expect.poll(() => page.locator('#ffrpRouteList .ffrp-point').count()).toBeGreaterThanOrEqual(18);

  await page.locator('.ffrp-side').evaluate(side => {
    side.style.height = '210px';
    side.style.maxHeight = '210px';
    side.style.overflowY = 'auto';
    side.scrollTop = 0;
  });

  for (let index = 0; index < setup.targetEvent; index += 1) {
    await page.locator('#ffrpNextEvent').click();
    await page.waitForTimeout(45);
  }

  await expect.poll(
    () => page.evaluate(() => Number(window.__FlightFlowFirBridge?.state?.index ?? -1))
  ).toBe(setup.targetEvent);

  await expect(page.locator('#ffrpRouteList .ffrp-point.active-point')).toHaveCount(1);
  await expect(page.locator('#ffrpRouteList .ffrp-point[aria-current="step"]')).toHaveCount(1);

  const position = await page.evaluate(() => {
    const side = document.querySelector('.ffrp-side');
    const head = document.querySelector('.ffrp-snap-head');
    const card = document.querySelector('#ffrpRouteList .ffrp-point.active-point');
    const sr = side.getBoundingClientRect();
    const hr = head.getBoundingClientRect();
    const cr = card.getBoundingClientRect();
    const maxScroll = Math.max(0, side.scrollHeight - side.clientHeight);
    return {
      scrollTop: side.scrollTop,
      scrollRatio: maxScroll > 0 ? side.scrollTop / maxScroll : 0,
      routeProgress: Number(window.FlightFlowRouteProcessedV7412?.getModel?.().routeProgress || 0),
      activeIndex: Number(card.dataset.plotIndex),
      visibleInSide: cr.top >= sr.top - 1 && cr.bottom <= sr.bottom + 1,
      clearOfStickyHeader: cr.top >= hr.bottom + 7,
    };
  });

  expect(position.activeIndex).toBe(setup.targetPoint);
  expect(position.scrollTop).toBeGreaterThan(0);
  expect(position.visibleInSide).toBe(true);
  expect(position.clearOfStickyHeader).toBe(true);
  expect(position.scrollRatio).toBeLessThan(0.92);
  expect(Math.abs(position.scrollRatio - position.routeProgress)).toBeLessThanOrEqual(0.22);
});
