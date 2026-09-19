'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const CSS = fs.readFileSync(path.join(ROOT, 'src', 'ui', 'shell-visual-refinement.css'), 'utf8');
const CHARTER = fs.readFileSync(path.join(ROOT, 'docs', 'EVOLUTION_CHARTER.md'), 'utf8');

test('Operational Command Bar V7 reutiliza integralmente os controles existentes', () => {
  assert.equal(INDEX.includes('operational-header-v7.js'), false);
  for (const id of [
    'fileInput','chooseFileBtn','readStartBtn','demoBtn',
    'newFileBtn','exportBtn','configBtn','fullscreenBtn','helpBtn'
  ]) {
    assert.equal((INDEX.match(new RegExp('id="' + id + '"', 'g')) || []).length, 1, id + ' deve permanecer único');
  }
  assert.ok(CHARTER.includes('## Operational Command Bar V7'));
  assert.ok(CHARTER.includes('A V7 é CSS/documentação/testes'));
});

test('Operational Command Bar V7 mantém shell externo e bancos internos técnicos', () => {
  const marker = 'FlightFlow Evolução — Operational Command Bar V7';
  const start = CSS.indexOf(marker);
  assert.ok(start >= 0);
  const source = CSS.slice(start);

  assert.ok(source.includes('--evo-command-surface: #071722'));
  assert.ok(source.includes('border-radius: 16px !important'));
  assert.ok(source.includes('.topbar .file-actions'));
  assert.ok(source.includes('border-radius: 0'));
  assert.ok(source.includes('.topbar .header-actions .icon-btn'));
  assert.ok(source.includes('border-radius: 4px'));
  assert.ok(source.includes('font: 700 10px/1.25 ui-monospace'));
  assert.ok(source.includes('html[data-theme="light"] .topbar'));
});

test('Operational Command Bar V7 cobre Velox, responsividade e reduced motion', () => {
  const source = CSS.slice(CSS.indexOf('FlightFlow Evolução — Operational Command Bar V7'));
  assert.ok(source.includes('html[data-palette="velox"]'));
  assert.ok(source.includes('@media (max-width: 1080px)'));
  assert.ok(source.includes('@media (max-width: 620px)'));
  assert.ok(source.includes('@media (prefers-reduced-motion: reduce)'));
});
