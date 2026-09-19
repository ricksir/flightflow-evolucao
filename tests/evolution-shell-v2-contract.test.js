'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const CSS = fs.readFileSync(path.join(ROOT, 'src', 'ui', 'shell-visual-refinement.css'), 'utf8');

function v2Css() {
  const marker = 'FlightFlow Evolução — Pilot Shell V2';
  const start = CSS.indexOf(marker);
  assert.ok(start >= 0, 'Pilot Shell V2 deve existir na camada visual');
  return CSS.slice(start);
}

test('Pilot Shell V2 explicita a hierarquia operacional sem duplicar controles', () => {
  assert.ok(HTML.includes('class="eyebrow evo-flight-kicker">VOO EM ANÁLISE'));
  assert.ok(HTML.includes('class="evo-status-kicker"'));
  assert.ok(HTML.includes('class="evo-map-tools-title"'));
  assert.ok(HTML.includes('class="evo-transport-kicker"'));

  for (const id of [
    'callsignTitle','adepTitle','adesTitle','statusBadge','stageBadge','frameCounter',
    'realMapControls','fieldsGrid','timelineList','scrubber'
  ]) {
    assert.equal((HTML.match(new RegExp('id="' + id + '"', 'g')) || []).length, 1, id + ' deve permanecer único');
  }
});

test('Pilot Shell V2 reduz cardização do quadro e mantém semântica de alteração', () => {
  const source = v2Css();
  assert.ok(source.includes('.fields-grid .field-card'));
  assert.ok(source.includes('border-radius: 0'));
  assert.ok(source.includes('.fields-grid .field-card.changed::before'));
  assert.ok(source.includes('background: var(--evo-terminal)'));
  assert.ok(source.includes('.timeline-item.active'));
  assert.ok(source.includes('.evo-transport-kicker'));
});

test('Pilot Shell V2 permanece estritamente visual', () => {
  const source = v2Css();
  for (const token of [
    'goTo(', 'renderCurrent(', 'currentEvent(', 'routeProgress',
    'movementProfile', 'replaceChildren(', 'queueMicrotask(',
    'setInterval(', 'setTimeout(', 'addEventListener('
  ]) {
    assert.equal(source.includes(token), false, 'V2 não deve conter lógica: ' + token);
  }
  assert.ok(source.includes('@media (prefers-reduced-motion: reduce)'));
  assert.ok(source.includes('html[data-theme="dark"]'));
  assert.ok(source.includes('html[data-palette="velox"]'));
});
