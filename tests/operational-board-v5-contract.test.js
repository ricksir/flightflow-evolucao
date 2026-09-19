'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const CSS = fs.readFileSync(path.join(ROOT, 'src', 'ui', 'shell-visual-refinement.css'), 'utf8');
const CHARTER = fs.readFileSync(path.join(ROOT, 'docs', 'EVOLUTION_CHARTER.md'), 'utf8');

test('Operational Board V5 permanece uma camada de apresentação sem script próprio', () => {
  assert.equal(INDEX.includes('evolution-operational-board-v5.js'), false);
  assert.ok(CHARTER.includes('## Operational Board V5'));
  assert.ok(CHARTER.includes('A V5 é CSS/documentação/testes'));
});

test('Operational Board V5 transforma o painel de dados em grade técnica contínua', () => {
  const marker = 'FlightFlow Evolução — Operational Board V5';
  const start = CSS.indexOf(marker);
  assert.ok(start >= 0);
  const source = CSS.slice(start);

  assert.ok(source.includes('.tab-panel[data-panel="data"]'));
  assert.ok(source.includes('content: "QUADRO OPERACIONAL"'));
  assert.ok(source.includes('grid-template-columns: repeat(2,minmax(0,1fr))'));
  assert.ok(source.includes('border-radius: 0'));
  assert.ok(source.includes('font-size: 10px'));
  assert.ok(source.includes('font-size: 12.5px'));
  assert.ok(source.includes('font-variant-numeric: tabular-nums'));
  assert.ok(source.includes('.field-card.changed::before'));
  assert.ok(source.includes('background: var(--evo-ter)'));
});

test('Operational Board V5 cobre temas, responsividade e reduced motion', () => {
  const source = CSS.slice(CSS.indexOf('FlightFlow Evolução — Operational Board V5'));
  assert.ok(source.includes('html[data-theme="dark"]'));
  assert.ok(source.includes('html[data-palette="velox"]'));
  assert.ok(source.includes('@media (max-width: 620px)'));
  assert.ok(source.includes('@media (prefers-reduced-motion: reduce)'));
});
