'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const CSS = fs.readFileSync(path.join(ROOT, 'src', 'ui', 'shell-visual-refinement.css'), 'utf8');

function pr23Css() {
  const marker = 'FlightFlow Evolução — PR23 Legibility and Card Refinement';
  const start = CSS.indexOf(marker);
  assert.ok(start >= 0, 'bloco PR23 deve existir');
  return CSS.slice(start);
}

test('PR23 aumenta tipografia operacional mínima do Quadro', () => {
  const source = pr23Css();
  for (const token of [
    '--evo-legibility-label: 12px',
    '--evo-legibility-value: 14px',
    '--evo-legibility-value-wide: 14.5px',
    '--evo-legibility-heading: 15px',
    '.fields-grid .field-label',
    '.fields-grid .field-value',
  ]) {
    assert.ok(source.includes(token), token + ' deve existir');
  }
});

test('PR23 reduz dominância do chip de alteração sem remover semântica', () => {
  const source = pr23Css();
  assert.ok(source.includes('.fields-grid .change-tag'));
  assert.ok(source.includes('font-size: 8px'));
  assert.ok(source.includes('opacity: .74'));
  assert.ok(source.includes('.field-card.changed .change-tag'));
  assert.ok(source.includes('border-color: rgba(213,138,0,.20)'));
  assert.ok(source.includes('background: #f8fbfc !important'));
  assert.ok(source.includes('background: #102b38 !important'));
  assert.ok(source.includes('background: #153b35 !important'));
});

test('PR23 melhora leitura de tabs, timeline, caption e controles do mapa', () => {
  const source = pr23Css();
  for (const selector of [
    '.inspector-tabs .tab',
    '.timeline-op',
    '.timeline-time',
    '.timeline-meta',
    '.scene-caption p',
    '.real-map-control-group button',
    '.real-map-layer-switches label',
  ]) {
    assert.ok(source.includes(selector), selector + ' deve estar contemplado');
  }
});

test('PR23 preserva responsividade e não toca contratos funcionais protegidos', () => {
  const source = pr23Css();
  assert.ok(source.includes('@media (min-width: 901px) and (max-width: 1180px)'));
  assert.ok(source.includes('@media (width <= 900px)'));
  assert.ok(source.includes('@media (max-width: 620px)'));

  for (const token of [
    'goTo(', 'buildTimeline(', 'state.index', 'routeProgress',
    'movementProfile', 'queueMicrotask(', 'replaceChildren(', 'addEventListener('
  ]) {
    assert.equal(source.includes(token), false, 'PR23 não deve conter lógica protegida: ' + token);
  }
});
