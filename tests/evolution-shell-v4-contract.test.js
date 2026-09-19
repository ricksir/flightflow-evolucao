'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const CSS = fs.readFileSync(path.join(ROOT, 'src', 'ui', 'shell-visual-refinement.css'), 'utf8');
const MODULE_PATH = path.join(ROOT, 'src', 'ui', 'evolution-shell-v4.js');
const MODULE_SOURCE = fs.readFileSync(MODULE_PATH, 'utf8');
const V4 = require(MODULE_PATH);

test('Pilot Shell V4 carrega como camada visual isolada', () => {
  assert.equal(
    INDEX.split('<script id="flightflow-evolution-shell-v4" src="src/ui/evolution-shell-v4.js" defer></script>').length - 1,
    1
  );
  assert.equal((INDEX.match(/id="transportMilestones"/g) || []).length, 1);
  assert.ok(INDEX.includes('class="evo-product-badge">EVOLUÇÃO</span>'));
  assert.ok(INDEX.includes('class="evo-rail-phase">'), 'rail phase hook deve permanecer disponível para evoluções visuais');
  assert.ok(INDEX.includes('V4 · OPERACIONAL'));
});

test('classificador V4 reconhece somente marcos de apresentação DEP TRF TER', () => {
  assert.equal(V4.classifyMilestone('DEP', 'Evento automático'), 'dep');
  assert.equal(V4.classifyMilestone('', 'Recepção de Mensagem DEP'), 'dep');
  assert.equal(V4.classifyMilestone('TRF', 'Coordenação'), 'trf');
  assert.equal(V4.classifyMilestone('', 'Transferência de controle'), 'trf');
  assert.equal(V4.classifyMilestone('TER', 'Encerramento'), 'ter');
  assert.equal(V4.classifyMilestone('', 'Ordem TER'), 'ter');
  assert.equal(V4.classifyMilestone('FPL', 'Recepção de Mensagem FPL'), '');
});

test('módulo V4 não implementa navegação, estado ou geometria', () => {
  for (const token of [
    'goTo(', 'state.index', 'routeProgress', 'movementProfile',
    'terminalClosureState(', 'replaceChildren(...Array.from',
    'queueMicrotask(', 'setInterval('
  ]) {
    assert.equal(MODULE_SOURCE.includes(token), false, 'camada V4 não deve conter lógica: ' + token);
  }
  assert.ok(MODULE_SOURCE.includes('MutationObserver'));
  assert.ok(MODULE_SOURCE.includes('decorateTimeline'));
});

test('CSS V4 preserva semântica cromática dos marcos e destaque TER', () => {
  const marker = 'FlightFlow Evolução — Pilot Shell V4';
  const start = CSS.indexOf(marker);
  assert.ok(start >= 0);
  const source = CSS.slice(start);
  assert.ok(source.includes('--evo-dep: #1686a8'));
  assert.ok(source.includes('--evo-trf: #7750a8'));
  assert.ok(source.includes('--evo-ter: #d58a00'));
  assert.ok(source.includes('.timeline-item.milestone-ter'));
  assert.ok(source.includes('.evo-transport-marker-ter'));
  assert.ok(source.includes('body:has(#timelineList .timeline-item.active.milestone-ter) .scene-status'));
  assert.ok(source.includes('@media (prefers-reduced-motion: reduce)'));
});
