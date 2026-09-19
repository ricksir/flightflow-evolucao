'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const CSS = fs.readFileSync(path.join(ROOT, 'src', 'ui', 'shell-visual-refinement.css'), 'utf8');
const ROUTE = fs.readFileSync(path.join(ROOT, 'src', 'route', 'route-processed-v7412.js'), 'utf8');

test('aceitação pós-V11 remove o texto literal de quebra de linha do head', () => {
  assert.equal(
    INDEX.includes('<link href="src/ui/shell-visual-refinement.css" rel="stylesheet"/>\\n<script id="flightflow-evolution-shell-v4"'),
    false
  );
  assert.ok(INDEX.includes('<link href="src/ui/shell-visual-refinement.css" rel="stylesheet"/>\n<script id="flightflow-evolution-shell-v4"'));
});

test('aceitação pós-V11 harmoniza o tema claro e reduz área morta sem criar lógica nova', () => {
  const start = CSS.indexOf('FlightFlow Evolução — Post-V11 Acceptance Corrections');
  assert.ok(start >= 0);
  const source = CSS.slice(start);

  assert.ok(source.includes('--evo-frame-rail-width: 80px'));
  assert.ok(source.includes('--evo-frame-gap: 4px'));
  assert.ok(source.includes('padding: 4px 4px 4px 0'));
  assert.ok(source.includes('html[data-theme="light"]:not([data-palette="velox"]) .topbar'));
  assert.ok(source.includes('html[data-theme="light"]:not([data-palette="velox"]) .evo-rail'));
  assert.ok(source.includes('html[data-theme="light"]:not([data-palette="velox"]) .transport'));
  assert.ok(source.includes('html[data-theme="light"]:not([data-palette="velox"]) .workspace-card .scene-caption'));
});

test('Rota Processada separa limite ETIM de limite de playback terminal', () => {
  assert.match(ROUTE, /function routePlaybackLimit\(snapshot,index=nativeEventIndex\(\)\)/);
  assert.match(ROUTE, /return terminal\.active \? 1 : timedProgressLimit\(snapshot\)/);
  assert.match(ROUTE, /limit=routePlaybackLimit\(snap\)/);
  assert.match(ROUTE, /routePlaybackLimit, transferMarkersForSnapshot/);
  assert.match(ROUTE, /queueMicrotask\(\(\)=>syncFromNativeTimeline\(\)\)/);
});
