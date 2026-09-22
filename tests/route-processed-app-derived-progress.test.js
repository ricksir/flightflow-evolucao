const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const MODULE = path.join(ROOT, 'src', 'route', 'route-processed-v7412.js');

const APP_DERIVED_FIXTURE = String.raw`
*****************************************************
* HISTÓRICO DE PLANOS *
* Indicativo do plano: TAM3720
* ADEP: SBBR      DOF: 260709   EOBT: 1225
*****************************************************

############################################################
OPERAÇÃO : Criação por Mensagem Automática (TTY)
data: 09/07/2026 hora: 12:05:05 posição: SPA01 ambiente: OpA
Estado: PRE Setor anterior: NUL NUL atual: DS NUL NUL seguinte: DS NUL NUL
Indicativo       : TAM3720
Velocidade       : N0450
ADEP             : SBBR
ADES             : SBCF
IDPLANO          : C9Z7MG00
Rota             : GEPMO UZ35 REINA

############################################################
OPERAÇÃO : Recepção de Mensagem DEP
data: 09/07/2026 hora: 12:29:11 posição: SPA01 ambiente: OpA
Estado: ATV Setor anterior: NUL NUL atual: DS REC NUL seguinte: DS REC NUL
Conteúdo         : (DEPSBBR/SBBR058-TAM3720-SBBR1229-SBCF-DOF/260709)

############################################################
OPERAÇÃO : Recepção de Mensagem ACP
data: 09/07/2026 hora: 12:35:08 posição: SPA01 ambiente: OpA
Estado: TRF Setor anterior: T3 NUL NUL atual: T3 NUL NUL seguinte: BS NUL NUL
Conteúdo         : (ACPSBBS/SBBR076-TAM3720/A4063-SBBR-SBCF)

############################################################
OPERAÇÃO : Evento Automático de Término
data: 09/07/2026 hora: 12:46:04 posição: SPA01 ambiente: OpA
Estado: TER Setor anterior: T3 NUL NUL atual: T3 NUL NUL seguinte: BS NUL NUL

############################################################
OPERAÇÃO : Evento Automático de Liberação de SSR
data: 09/07/2026 hora: 12:47:04 posição: SPA01 ambiente: OpA
Estado: TER Setor anterior: T3 NUL NUL atual: T3 NUL NUL seguinte: BS NUL NUL

############################################################
OPERAÇÃO : Evento Automático de Arquivamento
data: 10/07/2026 hora: 00:46:43 posição: SPA01 ambiente: OpA
Estado: ARQ Setor anterior: T3 NUL NUL atual: T3 NUL NUL seguinte: BS NUL NUL
############################################################
`;

function loadRouteApi() {
  let source = fs.readFileSync(MODULE, 'utf8');
  const initMarker = "  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0),{once:true});else setTimeout(init,0);\n})();";
  assert.ok(source.includes(initMarker));
  source = source.replace(initMarker, '  window.FlightFlowRouteProcessedV7412=publicApi();\n})();');
  const sandbox = { console };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: MODULE });
  return sandbox.FlightFlowRouteProcessedV7412;
}

function prepare(api) {
  const history = api.parseHistory(APP_DERIVED_FIXTURE, 'TAM3720APP-derived.txt');
  const model = api.getModel();
  model.history = history;
  for (const row of api.officialSeed) model.embedded.set(row.ident, { ...row });
  model.embedded.set('SBBR', { ident:'SBBR', lat:-15.870833, lon:-47.918333, kind:'airport', source:'fixture' });
  model.embedded.set('SBCF', { ident:'SBCF', lat:-19.624167, lon:-43.971667, kind:'airport', source:'fixture' });
  const seed = new Map(Array.from(api.officialSeed, row => [row.ident, row]));
  const snapshot = {
    ...history.snapshots[0],
    points: history.snapshots[0].points.map(point => ({
      ...point,
      geo: point.ident === 'SBBR' ? model.embedded.get('SBBR') : seed.get(point.ident) || null,
    })),
  };
  model.resolvedSnapshots = [snapshot];
  const profile = api.buildMovementProfile();
  model.movementProfile = profile;
  return { history, snapshot, profile };
}

test('APP sem ETIM deriva progresso somente após DEP usando rota publicada e velocidade declarada', () => {
  const api = loadRouteApi();
  const { history, snapshot, profile } = prepare(api);
  assert.equal(history.speedCode, 'N0450');
  assert.equal(history.speedKts, 450);
  assert.equal(profile.mode, 'derived');
  assert.equal(profile.source, 'DEP + geometria publicada + velocidade declarada');
  assert.deepEqual(Array.from(profile.points, point => point.ident), ['SBBR','GEPMO','ANBIR','IREGU','REINA','SBCF']);

  const depIndex = history.events.findIndex(event => /Mensagem DEP/i.test(event.operation));
  const transferIndex = history.events.findIndex(event => /Mensagem ACP/i.test(event.operation));
  const terIndex = history.events.findIndex(event => /Término/i.test(event.operation));
  const archiveIndex = history.events.findIndex(event => /Arquivamento/i.test(event.operation));

  assert.equal(profile.targets[depIndex], 0);
  assert.ok(profile.targets[transferIndex] > 0.10 && profile.targets[transferIndex] < 0.19);
  assert.ok(profile.targets[terIndex] > 0.34 && profile.targets[terIndex] < 0.47);
  assert.ok(profile.targets[terIndex] < 1, 'TER de jurisdição não pode levar ao ADES');
  assert.equal(profile.targets[archiveIndex], profile.targets[terIndex], 'arquivamento não pode teleportar ao destino');

  assert.equal(api.timedProgressLimit(snapshot), 0, 'não há ETIM histórico para fabricar');
  assert.equal(api.routePlaybackLimit(snapshot), 1, 'prévia manual pode percorrer a rota planejada completa');
  assert.ok(snapshot.points.every(point => point.etim === '' && point.etimKey === null));
});

test('transição APP derivada atravessa os fixos alcançados sem pular pontos', () => {
  const api = loadRouteApi();
  const { history } = prepare(api);
  const transferIndex = history.events.findIndex(event => /Mensagem ACP/i.test(event.operation));
  const terIndex = history.events.findIndex(event => /Término/i.test(event.operation));
  const plan = api.transitionPlanForEvents(transferIndex, terIndex);
  assert.ok(plan);
  assert.deepEqual(Array.from(plan.checkpoints, point => point.ident), ['GEPMO', 'ANBIR']);
});
