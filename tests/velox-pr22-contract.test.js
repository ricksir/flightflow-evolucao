'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const CSS = fs.readFileSync(path.join(ROOT, 'src', 'ui', 'shell-visual-refinement.css'), 'utf8');

function pr22Css() {
  const marker = 'FlightFlow Evolução — PR22 Velox Visual Identity';
  const start = CSS.indexOf(marker);
  assert.ok(start >= 0, 'bloco visual PR22 deve existir');
  return CSS.slice(start);
}

test('PR22 cria uma paleta de chrome própria para o Dashboard moderno', () => {
  const source = pr22Css();
  for (const token of [
    '--velox-chrome-deep',
    '--velox-chrome-base',
    '--velox-chrome-raised',
    '--velox-chrome-soft',
    '--velox-chrome-line',
    '--velox-chrome-text',
    '--velox-chrome-muted',
  ]) {
    assert.ok(source.includes(token), token + ' deve existir');
  }

  for (const selector of [
    '.topbar',
    '.workspace-card',
    '.inspector-card',
    '.transport',
    '.evo-rail',
    '.inspector-tabs',
    '.field-card',
    '.real-map-control-group',
    '.config-drawer',
  ]) {
    assert.ok(source.includes(selector), selector + ' deve receber chrome Velox');
  }
});

test('PR22 diferencia chrome e acento sem redefinir as cores semânticas ATS', () => {
  const source = pr22Css();
  assert.ok(source.includes('--ffds-accent: #49e7ad'));
  assert.ok(source.includes('--evo-command-accent: #49e7ad'));
  assert.ok(source.includes('--evo-mission-rail-accent: #49e7ad'));
  assert.ok(source.includes('--evo-temporal-accent: #49e7ad'));

  for (const semantic of ['--evo-dep:', '--evo-trf:', '--evo-ter:']) {
    assert.equal(source.includes(semantic), false, semantic + ' não deve ser redefinida pelo PR22');
  }
});

test('PR22 permanece exclusivamente visual', () => {
  const source = pr22Css();
  for (const token of [
    'state.index', 'routeProgress', 'movementProfile',
    'queueMicrotask(', 'replaceChildren(', 'addEventListener(',
    'setTimeout(', 'setInterval('
  ]) {
    assert.equal(source.includes(token), false, 'PR22 não deve conter lógica: ' + token);
  }
});
