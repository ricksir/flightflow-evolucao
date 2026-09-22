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
      mainBadge: document.querySelector('#ffrpMainBadge')?.textContent || '',
      mainBadgeHidden: document.querySelector('#ffrpMainBadge')?.hidden ?? true,
    };
  });

  expect(result.historyLoaded).toBe(true);
  expect(result.declaredFallback).toBe(true);
  expect(result.ids).toEqual(['SBBR', 'GEPMO', 'ANBIR', 'IREGU', 'REINA']);
  expect(result.geos.every(point => Number.isFinite(point.lat) && Number.isFinite(point.lon))).toBe(true);
  expect(result.timedLimit).toBe(0);
  expect(result.mainBadgeHidden).toBe(false);
  expect(result.mainBadge).toContain('ROTA PROCESSADA');

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
    const routeCards = Array.from(document.querySelectorAll('#ffrpRouteList .ffrp-point'))
      .map(node => node.textContent || '');
    return { declared, historical, pointCount, routeCards };
  });

  expect(visual.declared).toBeGreaterThanOrEqual(1);
  expect(visual.historical).toBe(0);
  expect(visual.pointCount).toBeGreaterThanOrEqual(6);
  expect(visual.routeCards.join(' ')).not.toMatch(/ETIM\s+\d/);
});
