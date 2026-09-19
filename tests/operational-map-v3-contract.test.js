'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const ROUTE = fs.readFileSync(path.join(ROOT, 'src', 'route', 'route-processed-v7412.js'), 'utf8');

function v3Source() {
  const marker = 'FlightFlow Evolução — Operational Map V3';
  const start = ROUTE.indexOf(marker);
  assert.ok(start >= 0, 'Operational Map V3 deve existir na camada visual');
  return ROUTE.slice(start);
}

test('Operational Map V3 formaliza as quatro classes visuais da rota', () => {
  const source = v3Source();

  assert.match(source, /\.ffrp-map \.route-line,[\s\S]*stroke:#d92d2a;[\s\S]*stroke-dasharray:none/);
  assert.match(source, /\.ffrp-map \.route-declared,[\s\S]*stroke:#177b98;[\s\S]*stroke-dasharray:7 7/);
  assert.match(source, /\.ffrp-map \.route-terminal,[\s\S]*stroke:#d58a00;[\s\S]*stroke-dasharray:none/);
  assert.match(source, /\.ffrp-map \.route-terminal\.pending,[\s\S]*stroke-dasharray:5 9/);

  assert.match(source, /\.ffrp-native-terminal-route\.ffrp-native-terminal-active/);
  assert.match(source, /stroke-dasharray:none!important/);
  assert.match(source, /\.ffrp-native-terminal-route\.ffrp-native-terminal-preview/);
});

test('legenda distingue histórico, continuação publicada, preview e TER ativo', () => {
  assert.match(ROUTE, /Histórico processado/);
  assert.match(ROUTE, /Continuação publicada · sem ETIM/);
  assert.match(ROUTE, /Terminal previsto/);
  assert.match(ROUTE, /Terminal ativo · TER/);
  assert.match(ROUTE, /ffrp-lg-terminal-preview/);
  assert.match(ROUTE, /ffrp-lg-terminal-active/);
});

test('Operational Map V3 reduz ruído sem introduzir lógica temporal ou espacial', () => {
  const source = v3Source();

  assert.match(source, /\.ffrp-map\.focus-mode \.wp\.is-muted\{[\s\S]*opacity:\.20/);
  assert.match(source, /\.ffrp-map \.wp \.meta\{[\s\S]*opacity:\.84/);
  assert.match(source, /\.ffrp-legend-items\{[\s\S]*grid-template-columns:1fr 1fr/);
  assert.match(source, /@media\(prefers-reduced-motion:reduce\)/);

  for (const token of [
    'goTo(', 'routeProgress=', 'movementProfile=', 'terminalClosureState(',
    'replaceChildren(', 'queueMicrotask(', 'setTimeout(', 'addEventListener('
  ]) {
    assert.equal(source.includes(token), false, 'V3 visual não deve implementar lógica: ' + token);
  }
});

test('contratos geométricos existentes continuam presentes e independentes da V3', () => {
  assert.match(ROUTE, /const terminalState=terminal\.active\?'active':'preview'/);
  assert.match(ROUTE, /const terminalLatLngs=\[\[Number\(terminal\.from\.geo\.lat\)/);
  assert.match(ROUTE, /class="route-terminal-underlay\$\{pending\}"/);
  assert.match(ROUTE, /class="route-terminal\$\{pending\}"/);
  assert.match(ROUTE, /data-etim="" data-cfl="" data-star=""/);
});
