'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const MODULE = path.join(ROOT, 'src', 'route', 'route-processed-v7412.js');

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

test('GLO7634 APP usa Fixo Saída como limite jurisdicional sem transformar ETO em ETIM', () => {
  const api = loadRouteApi();
  const history = api.parseHistory(GLO7634_APP, 'GLO7634APP.txt');

  assert.equal(history.callsign, 'GLO7634');
  assert.equal(history.adep, 'SBBR');
  assert.equal(history.ades, 'KMCO');
  assert.equal(history.speedCode, 'N0465');
  assert.equal(history.speedKts, 465);
  assert.equal(history.appExitFix, 'MILIX');
  assert.equal(history.appExitEto, '09-1225');
  assert.equal(history.snapshots.length, 1);

  const snapshot = history.snapshots[0];
  assert.equal(snapshot.declaredFallback, true);
  assert.equal(snapshot.jurisdictionBoundaryFallback, true);
  assert.deepEqual(Array.from(snapshot.points, point => point.ident), ['SBBR', 'MILIX']);
  assert.equal(snapshot.points[1].jurisdictionBoundary, true);
  assert.equal(snapshot.points[1].appExitEto, '09-1225');
  assert.equal(snapshot.points[1].etim, '');
  assert.equal(snapshot.points[1].etimKey, null);
});

test('base offline contém MILIX na coordenada publicada e perfil derivado termina no limite APP', () => {
  const api = loadRouteApi();
  const history = api.parseHistory(GLO7634_APP, 'GLO7634APP.txt');
  const model = api.getModel();
  model.history = history;

  const seed = new Map(Array.from(api.officialSeed, row => [row.ident, row]));
  const milix = seed.get('MILIX');
  assert.ok(milix);
  assert.equal(Number(milix.lat).toFixed(6), '-15.333333');
  assert.equal(Number(milix.lon).toFixed(4), '-48.7775');
  assert.match(milix.source, /AISWEB AIP ENR 4\.4/);

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
  assert.equal(api.movementPointsForProfile(snapshot).length, 2, 'KMCO não integra o perfil espacial do APP');
  const profile = api.buildMovementProfile();
  model.movementProfile = profile;
  assert.equal(profile.mode, 'derived');
  assert.equal(profile.speedKts, 465);
  assert.ok(profile.totalDistanceNm > 58 && profile.totalDistanceNm < 60);
  const depIndex = history.events.findIndex(event => /Mensagem DEP/i.test(event.operation));
  const acpIndex = history.events.findIndex(event => /Mensagem ACP/i.test(event.operation));
  const terIndex = history.events.findIndex(event => /Término/i.test(event.operation));
  const archiveIndex = history.events.findIndex(event => /Arquivamento/i.test(event.operation));
  assert.ok(depIndex >= 0 && acpIndex > depIndex && terIndex > acpIndex && archiveIndex > terIndex);
  assert.equal(profile.targets[depIndex], 0, 'no DEP a aeronave ainda está no ADEP');
  assert.ok(profile.targets[acpIndex] > 0 && profile.targets[acpIndex] < 1, 'ACP deve mostrar avanço rumo ao Fixo Saída');
  assert.equal(profile.targets[terIndex], 1, 'quando o término local ocorre após a passagem estimada do limite, permanece no Fixo Saída');
  assert.equal(profile.targets[archiveIndex], 1, 'arquivamento posterior não cria novo deslocamento');
  assert.equal(api.timedProgressLimit(snapshot), 0, 'ETO Saída jamais vira ETIM histórico');
});
