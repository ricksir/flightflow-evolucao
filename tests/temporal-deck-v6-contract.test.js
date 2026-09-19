'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const CSS = fs.readFileSync(path.join(ROOT, 'src', 'ui', 'shell-visual-refinement.css'), 'utf8');
const CHARTER = fs.readFileSync(path.join(ROOT, 'docs', 'EVOLUTION_CHARTER.md'), 'utf8');

test('Temporal Deck V6 permanece visual e reutiliza os controles existentes', () => {
  assert.equal(INDEX.includes('temporal-deck-v6.js'), false);
  assert.equal((INDEX.match(/id="scrubber"/g) || []).length, 1);
  assert.equal((INDEX.match(/id="transportMilestones"/g) || []).length, 1);
  assert.ok(CHARTER.includes('## Temporal Deck V6'));
  assert.ok(CHARTER.includes('A V6 é CSS/documentação/testes'));
});

test('Temporal Deck V6 estabelece superfície escura e hierarquia temporal legível', () => {
  const marker = 'FlightFlow Evolução — Temporal Deck V6';
  const start = CSS.indexOf(marker);
  assert.ok(start >= 0);
  const source = CSS.slice(start);

  assert.ok(source.includes('--evo-temporal-surface: #071722'));
  assert.ok(source.includes('grid-template-columns: auto minmax(360px,1fr) auto'));
  assert.ok(source.includes('border-radius: 8px'));
  assert.ok(source.includes('font: 850 9px/1'));
  assert.ok(source.includes('font: 900 9px/1'));
  assert.ok(source.includes('font-size: 11px'));
  assert.ok(source.includes('font-variant-numeric: tabular-nums'));
  assert.ok(source.includes('html[data-theme="light"] .transport'));
});

test('Temporal Deck V6 preserva responsividade, Velox e reduced motion', () => {
  const source = CSS.slice(CSS.indexOf('FlightFlow Evolução — Temporal Deck V6'));
  assert.ok(source.includes('html[data-palette="velox"]'));
  assert.ok(source.includes('@media (max-width: 900px)'));
  assert.ok(source.includes('@media (max-width: 620px)'));
  assert.ok(source.includes('@media (prefers-reduced-motion: reduce)'));
});
