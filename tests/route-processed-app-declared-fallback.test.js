const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const MODULE = path.join(ROOT, 'src', 'route', 'route-processed-v7412.js');

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

function loadRouteApi() {
  let source = fs.readFileSync(MODULE, 'utf8');
  const initMarker = "  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0),{once:true});else setTimeout(init,0);\n})();";
  assert.ok(source.includes(initMarker), 'bootstrap conhecido da Rota Processada deve permanecer localizável');
  source = source.replace(initMarker, '  window.FlightFlowRouteProcessedV7412=publicApi();\n})();');

  const sandbox = { console };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: MODULE });
  return sandbox.FlightFlowRouteProcessedV7412;
}

test('histórico APP sem PONTOS reconstrói a UZ35 declarada sem inventar ETIM/CFL', () => {
  const api = loadRouteApi();
  const history = api.parseHistory(APP_FIXTURE, 'TAM3720APP.txt');

  assert.equal(history.callsign, 'TAM3720');
  assert.equal(history.adep, 'SBBR');
  assert.equal(history.ades, 'SBCF');
  assert.equal(history.route, 'GEPMO UZ35 REINA');
  assert.equal(history.snapshots.length, 1);

  const snapshot = history.snapshots[0];
  assert.equal(snapshot.declaredFallback, true);
  assert.equal(snapshot.airway, 'UZ35');
  assert.deepEqual(
    Array.from(snapshot.points, point => point.ident),
    ['SBBR', 'GEPMO', 'ANBIR', 'IREGU', 'REINA']
  );
  assert.ok(snapshot.points.every(point => point.etim === ''));
  assert.ok(snapshot.points.every(point => point.etimKey === null));
  assert.ok(snapshot.points.every(point => point.cfl === ''));
  assert.ok(snapshot.points.slice(1).every(point => point.declared === true));
  assert.equal(snapshot.points[0].origin, true);
});

test('base offline cobre a sequência UZ35 usada pelo histórico APP', () => {
  const api = loadRouteApi();
  const seed = new Map(Array.from(api.officialSeed, row => [row.ident, row]));

  for (const ident of ['GEPMO', 'ANBIR', 'IREGU', 'REINA']) {
    const row = seed.get(ident);
    assert.ok(row, ident + ' deve existir na base offline');
    assert.match(row.source, /AISWEB AIP ENR 3\.2 · UZ35/);
    assert.ok(Number.isFinite(Number(row.lat)));
    assert.ok(Number.isFinite(Number(row.lon)));
  }
});

test('fallback APP permanece espacial e não move aeronave sem ETIM histórico', () => {
  const api = loadRouteApi();
  const history = api.parseHistory(APP_FIXTURE, 'TAM3720APP.txt');
  const model = api.getModel();
  model.history = history;

  const seed = new Map(Array.from(api.officialSeed, row => [row.ident, row]));
  const snapshot = {
    ...history.snapshots[0],
    points: history.snapshots[0].points.map(point => ({
      ...point,
      geo: point.ident === 'SBBR'
        ? { ident: 'SBBR', lat: -15.869167, lon: -47.920833, source: 'fixture', kind: 'airport' }
        : seed.get(point.ident) || null,
    })),
  };
  model.resolvedSnapshots = [snapshot];

  assert.equal(api.snapshotIsComplete(snapshot), true);
  assert.deepEqual(
    Array.from(api.declaredRouteContinuation(snapshot), point => point.ident),
    [],
    'a UZ35 já está integralmente representada no fallback e não pode ser duplicada'
  );
  assert.equal(api.timedProgressLimit(snapshot), 0, 'sem ETIM o fallback não pode fabricar progresso');
  assert.ok(
    api.movementPoints(snapshot).every(point => point.etimKey === null),
    'nenhum ponto declarado pode receber chave temporal sintética'
  );
});


function loadRawHistoryBridge({ domValue = '', parsed = null } = {}) {
  let source = fs.readFileSync(MODULE, 'utf8');
  const initMarker = "  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0),{once:true});else setTimeout(init,0);\n})();";
  assert.ok(source.includes(initMarker), 'bootstrap conhecido da Rota Processada deve permanecer localizável');
  source = source.replace(
    initMarker,
    "  window.__rawHistoryFromAppForTest=rawHistoryFromApp;\n  window.FlightFlowRouteProcessedV7412=publicApi();\n})();"
  );

  const fakeNode = domValue
    ? { value: domValue, textContent: domValue }
    : null;
  const sandbox = {
    console,
    document: { querySelector: () => fakeNode },
    __FlightFlowFirBridge: { state: { parsed } },
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: MODULE });
  return sandbox.__rawHistoryFromAppForTest;
}

test('ponte APP usa rawText do parser principal quando a aba original não fornece o histórico', () => {
  const read = loadRawHistoryBridge({ parsed: { rawText: APP_FIXTURE, events: [] } });
  assert.equal(read(), APP_FIXTURE);
});

test('ponte APP reconstrói o histórico pelos rawBlock quando rawText não está disponível', () => {
  const blockA = `OPERAÇÃO : Criação por Mensagem Automática (TTY)
data: 09/07/2026 hora: 12:05:05 posição: SPA01 ambiente: OpA
ADEP : SBBR
ADES : SBCF
Rota : GEPMO UZ35 REINA`;
  const blockB = `OPERAÇÃO : Recepção de Mensagem DEP
data: 09/07/2026 hora: 12:29:11 posição: SPA01 ambiente: OpA
Conteúdo : (DEPSBBR/SBBR058-TAM3720-SBBR1229-SBCF-DOF/260709)`;
  const read = loadRawHistoryBridge({ parsed: { events: [{ rawBlock: blockA }, { rawBlock: blockB }] } });
  const value = read();
  assert.match(value, /Rota\s*:\s*GEPMO UZ35 REINA/);
  assert.match(value, /Recepção de Mensagem DEP/);
});

test('ponte prefere a representação completa quando DOM e parser possuem cópias diferentes', () => {
  const partial = 'OPERAÇÃO : Evento parcial';
  const read = loadRawHistoryBridge({ domValue: partial, parsed: { rawText: APP_FIXTURE, events: [] } });
  assert.equal(read(), APP_FIXTURE);
});
