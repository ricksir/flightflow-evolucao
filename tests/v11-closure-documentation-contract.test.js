'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

const README = read('README.md');
const ROADMAP = read('docs/ROADMAP.md');
const AI = read('docs/AI_CURRENT_STATE.md');
const MANUAL = read('docs/MANUAL-ACCEPTANCE.md');
const RELEASE = read('docs/RELEASE-READINESS.md');
const CHANGELOG = read('CHANGELOG.md');

test('fechamento V11 aponta para o repositório de evolução e certificação atual', () => {
  assert.ok(AI.includes('ricksir/flightflow-evolucao'));
  assert.ok(AI.includes('a27ffee33577d88536a3828f9f3cca97b47fc898'));
  assert.ok(AI.includes('675/675 Node'));
  assert.ok(AI.includes('79/79 Playwright'));
  assert.ok(AI.includes('workflow **#59**'));
  assert.ok(README.includes('V11 — Flight Situation Strip'));
});

test('fechamento V11 não declara aceitação manual inexistente', () => {
  assert.ok(README.includes('pendente de execução/aprovação humana'));
  assert.ok(MANUAL.includes('Aceitação humana ainda **pendente**'));
  assert.ok(MANUAL.includes('**Resultado da aceitação:** [ ] APROVADO'));
  assert.ok(RELEASE.includes('não equivale a aceitação manual'));
});

test('roadmap e changelog registram a conclusão automática e próximos passos', () => {
  assert.ok(ROADMAP.includes('19/09/2026'));
  assert.ok(ROADMAP.includes('Evolução visual V1–V11'));
  assert.ok(ROADMAP.includes('Não iniciar V12 automaticamente'));
  assert.ok(CHANGELOG.includes('FlightFlow Evolução V1–V11'));
  assert.ok(CHANGELOG.includes('675/675 Node + 79/79 Playwright'));
});

test('aceitação manual cobre breakpoints e fluxos protegidos da V11', () => {
  assert.ok(MANUAL.includes('1600×900'));
  assert.ok(MANUAL.includes('1100×820'));
  assert.ok(MANUAL.includes('Abaixo de 900 px'));
  assert.ok(MANUAL.includes('PADIL → IRISO → LIBEC → EGDOD → IBGAM → PMS → ILVES → MASVA'));
  assert.ok(MANUAL.includes('UMGUL → SBCT'));
});
