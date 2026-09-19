'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const CSS = fs.readFileSync(path.join(ROOT, 'src', 'ui', 'shell-visual-refinement.css'), 'utf8');
const CHARTER = fs.readFileSync(path.join(ROOT, 'docs', 'EVOLUTION_CHARTER.md'), 'utf8');

test('Workspace Composition V8 permanece visual e sem script próprio', () => {
  assert.equal(INDEX.includes('workspace-composition-v8.js'), false);
  assert.ok(CHARTER.includes('## Workspace Composition V8'));
  assert.ok(CHARTER.includes('A V8 é CSS/documentação/testes'));
});

test('Workspace Composition V8 fixa a gramática rail mapa quadro no desktop', () => {
  const marker = 'FlightFlow Evolução — Workspace Composition V8';
  const start = CSS.indexOf(marker);
  assert.ok(start >= 0);
  const source = CSS.slice(start);

  assert.ok(source.includes('--evo-frame-rail-width: 84px'));
  assert.ok(source.includes('--evo-frame-rail-inset: 8px'));
  assert.ok(source.includes('--evo-frame-rail-gutter: 8px'));
  assert.ok(source.includes('--evo-frame-panel-width: 380px'));
  assert.ok(source.includes('--evo-frame-gap: 8px'));
  assert.ok(source.includes('@media (min-width: 901px)'));
  assert.ok(source.includes('grid-template-columns: calc(var(--evo-frame-rail-width) + var(--evo-frame-rail-gutter)) minmax(0,1fr)'));
  assert.ok(source.includes('grid-template-columns: minmax(0,1fr) minmax(350px,var(--evo-frame-panel-width))'));
  assert.ok(source.includes('max-width: var(--evo-frame-panel-width)'));
  assert.ok(source.includes('border-radius: var(--evo-frame-radius)'));
});

test('Workspace Composition V8 reduz o quadro em desktop intermediário sem tocar no mobile', () => {
  const source = CSS.slice(CSS.indexOf('FlightFlow Evolução — Workspace Composition V8'));
  assert.ok(source.includes('@media (min-width: 901px) and (max-width: 1180px)'));
  assert.ok(source.includes('--evo-frame-rail-gutter: 6px'));
  assert.ok(source.includes('--evo-frame-panel-width: 340px'));
  assert.equal(source.includes('@media (max-width: 900px)'), false);
});
