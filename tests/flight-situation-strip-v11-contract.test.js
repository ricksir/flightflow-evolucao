'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const CSS = fs.readFileSync(path.join(ROOT, 'src', 'ui', 'shell-visual-refinement.css'), 'utf8');
const CHARTER = fs.readFileSync(path.join(ROOT, 'docs', 'EVOLUTION_CHARTER.md'), 'utf8');
const DESIGN = fs.readFileSync(path.join(ROOT, 'docs', 'DESIGN_SYSTEM.md'), 'utf8');

test('Flight Situation Strip V11 permanece apresentação pura', () => {
  assert.ok(CHARTER.includes('## Flight Situation Strip V11'));
  assert.ok(DESIGN.includes('## 15. Flight Situation Strip V11'));
  assert.ok(CHARTER.includes('A V11 é CSS/documentação/testes'));
  assert.ok(CHARTER.includes('nenhum estado é recalculado'));
});

test('Flight Situation Strip V11 define faixa linear e células técnicas', () => {
  const start = CSS.indexOf('FlightFlow Evolução — Flight Situation Strip V11');
  assert.ok(start >= 0);
  const source = CSS.slice(start);
  assert.ok(source.includes('grid-template-columns: minmax(0,1fr) auto'));
  assert.ok(source.includes('min-height: 58px'));
  assert.ok(source.includes('.route-airports {'));
  assert.ok(source.includes('font-family: ui-monospace'));
  assert.ok(source.includes('font-variant-numeric: tabular-nums'));
  assert.ok(source.includes('.scene-status {'));
  assert.ok(source.includes('border-left: 1px solid var(--evo-situation-line-strong)'));
  assert.ok(source.includes('border-radius: 4px'));
  assert.ok(source.includes('height: 26px'));
});

test('Flight Situation Strip V11 preserva responsividade, temas e reduced motion', () => {
  const source = CSS.slice(CSS.indexOf('FlightFlow Evolução — Flight Situation Strip V11'));
  assert.ok(source.includes('html[data-theme="light"]'));
  assert.ok(source.includes('html[data-theme="dark"]'));
  assert.ok(source.includes('html[data-palette="velox"]'));
  assert.ok(source.includes('@media (min-width: 901px) and (max-width: 1180px)'));
  assert.ok(source.includes('@media (prefers-reduced-motion: reduce)'));
});
