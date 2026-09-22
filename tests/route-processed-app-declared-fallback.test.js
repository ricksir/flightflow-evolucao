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
EOBT: 1225

############################################################
OPERAÇÃO : Criação por Mensagem Automática (TTY)
data:   09/07/2026      hora:   12:05:05      posição: SPA01      ambiente: OpA
Estado: PRE Setor anterior: NUL NUL atual: DS NUL NUL seguinte: DS NUL NUL
Indicativo       : TAM3720
Velocidade       : N0450
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
  assert.equal(history.eobt, '1225');
  assert.equal(history.speed, 'N0450');
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

test('fallback APP sem ETIM move somente após DEP por perfil derivado e congela no término local', () => {
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
  assert.equal(api.timedProgressLimit(snapshot), 0, 'perfil derivado não pode virar ETIM histórico');
  assert.ok(
    api.movementPoints(snapshot).every(point => point.etimKey === null),
    'nenhum ponto declarado pode receber chave temporal sintética'
  );

  const profile = api.buildMovementProfile();
  model.movementProfile = profile;
  assert.equal(profile.derivedUntimed, true);
  assert.equal(profile.speedKnots, 450);
  assert.ok(profile.distanceNm > 200 && profile.distanceNm < 210);
  assert.deepEqual(Array.from(profile.targets.slice(0, 2)), [0, 0], 'antes e no DEP a aeronave permanece no ADEP');
  assert.ok(profile.targets[2] > 0 && profile.targets[2] < 1, 'após DEP o evento ACP deve mostrar avanço espacial derivado');
  assert.ok(profile.targets[3] > profile.targets[2], 'até o término local ainda há progressão temporal observável');
  assert.equal(profile.targets[4], profile.targets[3], 'arquivamento posterior não pode empurrar a aeronave até o ADES');
  assert.ok(profile.maxDerivedProgress < 1, 'TER local do APP não representa chegada ao destino');
  assert.equal(api.routePlaybackLimit(snapshot), profile.maxDerivedProgress);

  const plan = api.transitionPlanForEvents(1, 3);
  assert.ok(plan);
  assert.deepEqual(
    Array.from(plan.checkpoints, point => point.ident),
    ['GEPMO', 'ANBIR'],
    'a transição derivada deve cruzar explicitamente os fixos alcançados no intervalo'
  );
});


const CANCELLED_APP_FIXTURE = String.raw`
Indicativo do plano: PSFBU
ADEP: SBBR
ADES: SBGO
EOBT: 1302

############################################################
OPERAÇÃO : Criação por Mensagem Automática (TTY)
data: 09/07/2026 hora: 12:42:10 posição: SPA01 ambiente: OpA
Estado: PRE Setor anterior: NUL NUL atual: T4 NUL NUL seguinte: T4 NUL NUL
Indicativo : PSFBU
Velocidade : N0300
ADEP : SBBR
ADES : SBGO
Rota : DCT

############################################################
OPERAÇÃO : Recepção de Mensagem TTY CNL
data: 09/07/2026 hora: 12:48:36 posição: SPA01 ambiente: OpA
Estado: TER Setor anterior: NUL NUL atual: T4 NUL NUL seguinte: T4 NUL NUL
Conteúdo : (FPVD/CNL PSFBU SBBR SBGO)

############################################################
OPERAÇÃO : Evento Automático de Arquivamento
data: 10/07/2026 hora: 00:48:43 posição: SPA01 ambiente: OpA
Estado: ARQ Setor anterior: NUL NUL atual: T4 NUL NUL seguinte: T4 NUL NUL
`;

test('plano APP cancelado sem DEP nunca habilita movimento derivado', () => {
  const api = loadRouteApi();
  const history = api.parseHistory(CANCELLED_APP_FIXTURE, 'PSFBUAPP.txt');
  const model = api.getModel();
  model.history = history;

  const snapshot = {
    blockIndex: 0,
    eventDt: history.events[0].eventDt,
    operation: 'fixture DCT sem PONTOS/ETIM',
    signature: 'psfbu-dct',
    declaredFallback: true,
    points: [
      { ident: 'SBBR', etim: '', etimKey: null, cfl: '', geo: { ident: 'SBBR', lat: -15.869167, lon: -47.920833, source: 'fixture', kind: 'airport' } },
      { ident: 'SBGO', etim: '', etimKey: null, cfl: '', geo: { ident: 'SBGO', lat: -16.632033, lon: -49.220686, source: 'fixture', kind: 'airport' } },
    ],
  };
  model.resolvedSnapshots = [snapshot];
  const profile = api.buildMovementProfile();
  assert.ok(profile);
  assert.equal(profile.derivedUntimed, false);
  assert.ok(profile.targets.every(value => value === 0), 'CNL sem DEP não pode produzir deslocamento');
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
