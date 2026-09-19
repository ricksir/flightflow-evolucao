'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const CSS = fs.readFileSync(path.join(ROOT, 'src', 'ui', 'shell-visual-refinement.css'), 'utf8');

test('Pilot Shell V1 mantém rail de evolução fora do núcleo funcional', () => {
  assert.ok(HTML.includes('<nav class="evo-rail" aria-label="Navegação FlightFlow Evolução">'));
  assert.ok(HTML.includes('href="#workspaceCard"'));
  assert.ok(HTML.includes('href="#dropZone"'));
  assert.ok(HTML.includes('href="#fieldsGrid"'));
  assert.ok(HTML.includes('href="#timelineList"'));
});

test('Pilot Shell V1 preserva IDs críticos únicos', () => {
  for (const id of [
    'app','workspaceCard','dropZone','fieldsGrid','timelineList',
    'restartBtn','prevBtn','playBtn','nextBtn','scrubber',
    'configBtn','knowledgeBaseBtn'
  ]) {
    const count = (HTML.match(new RegExp('id="' + id + '"', 'g')) || []).length;
    assert.equal(count, 1, id + ' deve permanecer único');
  }
});

test('Pilot Shell V1 é uma camada CSS de composição e não contém lógica temporal/espacial', () => {
  assert.ok(CSS.includes('FlightFlow Evolução — Pilot Shell V1'));
  assert.ok(CSS.includes('grid-template-areas:'));
  assert.ok(CSS.includes('"rail topbar"'));
  assert.ok(CSS.includes('"rail content"'));
  assert.ok(CSS.includes('"rail transport"'));
  assert.ok(CSS.includes('--evo-terminal: #d58a00'));
  assert.ok(CSS.includes('@media (prefers-reduced-motion: reduce)'));

  const pilot = CSS.slice(CSS.indexOf('FlightFlow Evolução — Pilot Shell V1'));
  for (const token of [
    'goTo(', 'currentEvent(', 'renderCurrent(', 'state.index',
    'routeProgress', 'movementProfile', 'replaceChildren(', 'queueMicrotask('
  ]) {
    assert.equal(pilot.includes(token), false, 'camada visual não deve conter lógica: ' + token);
  }
});
