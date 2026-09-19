'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const CSS = fs.readFileSync(path.join(ROOT, 'src', 'ui', 'shell-visual-refinement.css'), 'utf8');
const CHARTER = fs.readFileSync(path.join(ROOT, 'docs', 'EVOLUTION_CHARTER.md'), 'utf8');
const DESIGN = fs.readFileSync(path.join(ROOT, 'docs', 'DESIGN_SYSTEM.md'), 'utf8');

test('Living Operational Chart V10 permanece apresentação pura', () => {
  assert.equal(INDEX.includes('living-operational-chart-v10.js'), false);
  assert.ok(CHARTER.includes('## Living Operational Chart V10'));
  assert.ok(DESIGN.includes('## 14. Living Operational Chart V10'));
  assert.ok(CHARTER.includes('Não altera HTML, JavaScript, SVG, Leaflet, parser'));
});

test('Living Operational Chart V10 consolida moldura e overlays técnicos', () => {
  const start = CSS.indexOf('FlightFlow Evolução — Living Operational Chart V10');
  assert.ok(start >= 0);
  const source = CSS.slice(start);

  assert.ok(source.includes('.scene-wrap {'));
  assert.ok(source.includes('border-radius: 9px'));
  assert.ok(source.includes('.real-map-control-group button {'));
  assert.ok(source.includes('height: 32px'));
  assert.ok(source.includes('.scene-caption {'));
  assert.ok(source.includes('.real-map-status {'));
  assert.ok(source.includes('border-radius: 6px'));
  assert.ok(source.includes('.scene-legend {'));
  assert.ok(source.includes('min-height: 36px'));
  assert.ok(source.includes('font-variant-numeric: tabular-nums'));
});

test('Living Operational Chart V10 preserva superfície clara e não redefine trajetórias V3', () => {
  const source = CSS.slice(CSS.indexOf('FlightFlow Evolução — Living Operational Chart V10'));
  assert.ok(source.includes('--evo-chart-surface: #f4f8f8'));
  assert.ok(source.includes('html[data-palette="velox"]'));
  assert.equal(/processed-route|terminal-route|published-route|route-history|route-preview/.test(source), false);
  assert.ok(CHARTER.includes('As regras cartográficas da V3 continuam soberanas'));
});
