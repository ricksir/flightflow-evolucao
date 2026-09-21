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

test('fechamento técnico atual preserva histórico V11 e registra certificação pós-PR23', () => {
  assert.ok(AI.includes('ricksir/flightflow-evolucao'));
  assert.ok(AI.includes('cd4adf92d726ed3a2dea0fe4fa23744b41784b4f'));
  assert.ok(AI.includes('696/696 Node'));
  assert.ok(AI.includes('97/97 Playwright'));
  assert.ok(AI.includes('quality gate pós-merge **#90**'));
  assert.ok(AI.includes('a27ffee33577d88536a3828f9f3cca97b47fc898'));
  assert.ok(README.includes('V11 — Flight Situation Strip'));
});

test('fechamento técnico não declara revalidação humana inexistente', () => {
  assert.ok(README.includes('revalidação final pós-PR23 pendente'));
  assert.ok(MANUAL.includes('revalidação humana final pendente'));
  assert.ok(MANUAL.includes('**Resultado da aceitação:** [ ] APROVADO'));
  assert.ok(RELEASE.includes('revalidação humana do novo `main` ainda é necessária'));
});

test('roadmap e changelog registram remediação concluída e próximos passos', () => {
  assert.ok(ROADMAP.includes('21/09/2026'));
  assert.ok(ROADMAP.includes('Evolução visual V1–V11'));
  assert.ok(ROADMAP.includes('PR #20 — navegação lateral'));
  assert.ok(ROADMAP.includes('PR #23 — legibilidade'));
  assert.ok(ROADMAP.includes('Não iniciar V12 automaticamente'));
  assert.ok(CHANGELOG.includes('PRs **#20–#23**'));
  assert.ok(CHANGELOG.includes('696/696 Node + 97/97 Playwright'));
});

test('aceitação manual cobre breakpoints, fluxos protegidos e os quatro achados corrigidos', () => {
  assert.ok(MANUAL.includes('1600×900'));
  assert.ok(MANUAL.includes('1100×820'));
  assert.ok(MANUAL.includes('Abaixo de 900 px'));
  assert.ok(MANUAL.includes('PR20 / navegação'));
  assert.ok(MANUAL.includes('PR21 / colisões'));
  assert.ok(MANUAL.includes('PR22 / Velox'));
  assert.ok(MANUAL.includes('PR23 / legibilidade'));
  assert.ok(MANUAL.includes('PADIL → IRISO → LIBEC → EGDOD → IBGAM → PMS → ILVES → MASVA'));
  assert.ok(MANUAL.includes('UMGUL → SBCT'));
});
