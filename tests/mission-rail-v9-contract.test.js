'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const CSS = fs.readFileSync(path.join(ROOT, 'src', 'ui', 'shell-visual-refinement.css'), 'utf8');
const CHARTER = fs.readFileSync(path.join(ROOT, 'docs', 'EVOLUTION_CHARTER.md'), 'utf8');

test('Mission Rail V9 reutiliza a navegação existente sem script próprio', () => {
  assert.equal(INDEX.includes('mission-rail-v9.js'), false);
  assert.ok(INDEX.includes('MISSION RAIL V9'));
  assert.ok(INDEX.includes('V9 · MISSÃO'));
  assert.equal((INDEX.match(/class="evo-rail-item/g) || []).length, 5);
  assert.ok(CHARTER.includes('## Mission Rail V9'));
});

test('Mission Rail V9 estabelece active-state linear e células de ícone técnicas', () => {
  const start = CSS.indexOf('FlightFlow Evolução — Mission Rail V9');
  assert.ok(start >= 0);
  const source = CSS.slice(start);

  assert.ok(source.includes('--evo-mission-rail-surface: #061722'));
  assert.ok(source.includes('border-radius: 6px'));
  assert.ok(source.includes('width: 28px'));
  assert.ok(source.includes('height: 28px'));
  assert.ok(source.includes('.evo-rail-item.active::before'));
  assert.ok(source.includes('width: 2px'));
  assert.ok(source.includes('background: var(--evo-mission-rail-accent)'));
});

test('Mission Rail V9 preserva light, Velox, teclado e reduced motion', () => {
  const source = CSS.slice(CSS.indexOf('FlightFlow Evolução — Mission Rail V9'));
  assert.ok(source.includes('html[data-theme="light"] .evo-rail'));
  assert.ok(source.includes('html[data-palette="velox"]'));
  assert.ok(source.includes('.evo-rail-item:focus-visible'));
  assert.ok(source.includes('@media (prefers-reduced-motion: reduce)'));
});
