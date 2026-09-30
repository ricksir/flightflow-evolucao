const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const MODULE = path.join(ROOT, 'src', 'route', 'route-processed-v7412.js');

const PTRSN_FIXTURE = String.raw`
Indicativo do plano: PTRSN
ADEP: SWGI
ADES: SNQE
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

test('PTRSN preserva PONTOS históricos e acrescenta apenas o sufixo DCT declarado sem ETIM', () => {
  const api = loadRouteApi();
  const history = api.parseHistory(PTRSN_FIXTURE, 'PTRSN_SWGI-1330.txt');

  assert.equal(history.callsign, 'PTRSN');
  assert.equal(history.adep, 'SWGI');
  assert.equal(history.ades, 'SNQE');
  assert.equal(
    history.route,
    'DCT 1101S04913W DCT 0947S04922W DCT 0832S04931W DCT 0718S04941W DCT'
  );

  const snapshot = history.snapshots[0];
  assert.equal(snapshot.declaredFallback, undefined);
  assert.deepEqual(
    Array.from(snapshot.points, point => point.ident),
    ['SWGI', '1101S04913W', '1015S04918W'],
    'o quadro PONTOS do histórico não pode ser reescrito pela rota declarada'
  );

  api.getModel().history = history;
  const continuation = api.declaredRouteContinuation(snapshot);

  assert.deepEqual(
    Array.from(continuation, point => point.ident),
    ['0947S04922W', '0832S04931W', '0718S04941W'],
    'a continuação deve começar após o último ponto em comum com a rota declarada'
  );
  assert.ok(continuation.every(point => point.declared === true));
  assert.ok(continuation.every(point => point.untimed === true));
  assert.ok(continuation.every(point => point.etim === ''));
  assert.ok(continuation.every(point => point.etimKey === null));
  assert.ok(continuation.every(point => point.cfl === ''));
  assert.ok(continuation.every(point => point.airway === 'DCT'));
  assert.ok(continuation.every(point => point.geo?.kind === 'coordinate'));
  assert.ok(continuation.every(point => /rota declarada/i.test(point.geo?.source || '')));

  assert.equal(snapshot.points.length, 3, 'a função não deve mutar o histórico processado');
  assert.equal(snapshot.points.at(-1).ident, '1015S04918W');
});
