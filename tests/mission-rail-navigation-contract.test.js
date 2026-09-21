'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const CSS = fs.readFileSync(path.join(ROOT, 'src', 'ui', 'shell-visual-refinement.css'), 'utf8');
const MODULE_PATH = path.join(ROOT, 'src', 'ui', 'mission-rail-navigation.js');
const MODULE_SOURCE = fs.readFileSync(MODULE_PATH, 'utf8');
const RailNavigation = require(MODULE_PATH);

test('PR20 carrega controlador de navegação do Mission Rail exatamente uma vez', () => {
  const tag = '<script id="flightflow-mission-rail-navigation" src="src/ui/mission-rail-navigation.js" defer></script>';
  assert.equal(INDEX.split(tag).length - 1, 1);
  assert.equal((INDEX.match(/class="evo-rail-item/g) || []).length, 5);
});

test('PR20 mapeia cada item do rail para o comportamento funcional esperado', () => {
  assert.deepEqual(RailNavigation.routeForHref('#workspaceCard'), {
    key: 'operation', label: 'Operação', target: '#workspaceCard'
  });
  assert.deepEqual(RailNavigation.routeForHref('#dropZone'), {
    key: 'map', label: 'Mapa', target: '#dropZone'
  });
  assert.deepEqual(RailNavigation.routeForHref('#fieldsGrid'), {
    key: 'board', label: 'Quadro', target: '[data-panel="data"]', tab: 'data'
  });
  assert.deepEqual(RailNavigation.routeForHref('#timelineList'), {
    key: 'events', label: 'Eventos', target: '[data-panel="timeline"]', tab: 'timeline'
  });
  assert.deepEqual(RailNavigation.routeForHref('#knowledgeBaseBtn'), {
    key: 'base', label: 'Base', target: '#knowledgeBrowserModal', control: '#knowledgeBaseBtn'
  });
  assert.equal(RailNavigation.routeForHref('#unknown'), null);
});

test('PR20 mantém o controlador fora dos contratos temporal e espacial', () => {
  for (const token of [
    'goTo(', 'buildTimeline(', 'state.index', 'routeProgress',
    'movementProfile', 'terminalClosureState(', 'queueMicrotask('
  ]) {
    assert.equal(MODULE_SOURCE.includes(token), false, 'navegação do rail não deve tocar em ' + token);
  }
});

test('PR20 possui feedback visual e acessível sem alterar a identidade do rail', () => {
  assert.ok(MODULE_SOURCE.includes("role', 'status"));
  assert.ok(MODULE_SOURCE.includes("aria-live', 'polite"));
  assert.ok(MODULE_SOURCE.includes("aria-current', 'location"));
  assert.ok(MODULE_SOURCE.includes('flightflow:rail-navigate'));

  const start = CSS.indexOf('FlightFlow Evolução — PR20 Mission Rail Navigation Feedback');
  assert.ok(start >= 0);
  const source = CSS.slice(start);
  assert.ok(source.includes('.evo-rail-feedback'));
  assert.ok(source.includes('.evo-rail-target-pulse'));
  assert.ok(source.includes('html[data-palette="velox"] .evo-rail-target-pulse'));
  assert.ok(source.includes('@media (prefers-reduced-motion: reduce)'));
});
