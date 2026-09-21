'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const CSS = fs.readFileSync(path.join(ROOT, 'src', 'ui', 'shell-visual-refinement.css'), 'utf8');

test('PR21 reserva faixas independentes para status e marcos temporais', () => {
  const marker = 'FlightFlow Evolução — PR21 Collision-Safe Layout';
  const start = CSS.indexOf(marker);
  assert.ok(start >= 0, 'bloco PR21 deve existir');
  const source = CSS.slice(start);

  assert.ok(source.includes('.scene-status'));
  assert.ok(source.includes('flex-wrap: wrap'));
  assert.ok(source.includes('.evo-status-kicker'));
  assert.ok(source.includes('position: static !important'));
  assert.ok(source.includes('.scene-protocol-toggle'));
  assert.ok(source.includes('height: auto !important'));
  assert.ok(source.includes('.scrubber-wrap'));
  assert.ok(source.includes('padding-top: 42px !important'));
  assert.ok(source.includes('.evo-transport-milestones'));
  assert.ok(source.includes('top: 28px !important'));
});

test('PR21 protege desktop, largura intermediária e viewport abaixo de 900px', () => {
  const source = CSS.slice(CSS.indexOf('FlightFlow Evolução — PR21 Collision-Safe Layout'));
  assert.ok(source.includes('@media (min-width: 1181px)'));
  assert.ok(source.includes('@media (min-width: 901px) and (max-width: 1180px)'));
  assert.ok(source.includes('@media (width <= 900px)'));
  assert.ok(source.includes('@media (max-width: 620px)'));
  assert.ok(source.includes('.protocol-card.protocol-floating'));
});

test('PR21 permanece estritamente geométrico e não toca contratos protegidos', () => {
  const source = CSS.slice(CSS.indexOf('FlightFlow Evolução — PR21 Collision-Safe Layout'));
  for (const token of [
    'goTo(', 'buildTimeline(', 'state.index', 'routeProgress',
    'movementProfile', 'queueMicrotask(', 'replaceChildren('
  ]) {
    assert.equal(source.includes(token), false, 'PR21 não deve conter lógica protegida: ' + token);
  }
});
