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

test('fechamento técnico atual preserva histórico V11/PR70 e registra certificação pós-PR87', () => {
  assert.ok(AI.includes('ricksir/flightflow-evolucao'));
  assert.ok(AI.includes('2d3ebd01b888f5760abe4ddd3d46ba287de0b782'));
  assert.ok(AI.includes('698/698 Node'));
  assert.ok(AI.includes('108/108 Playwright'));
  assert.ok(AI.includes('quality gate pós-merge **#124**'));
  assert.ok(AI.includes('a27ffee33577d88536a3828f9f3cca97b47fc898'));
  assert.ok(AI.includes('ff6f2e7a63e475ae80caa1a54b28e0eb2440eaf2'));
  assert.ok(AI.includes('134/134 Playwright'));
  assert.ok(AI.includes('workflow pós-merge **#232**'));
  assert.ok(AI.includes('cb9d97485ecb10606de223e8a18cc0a851120552'));
  assert.ok(AI.includes('135/135 Playwright'));
  assert.ok(AI.includes('run **#270**'));
  assert.ok(AI.includes('0 arquivos diferentes'));
  assert.ok(README.includes('V11 — Flight Situation Strip'));
  assert.ok(README.includes('PR87'));
  assert.ok(README.includes('135/135 Playwright'));
});

test('fechamento técnico não declara revalidação humana inexistente', () => {
  assert.ok(README.includes('revalidação humana final do baseline pós-PR87 pendente'));
  assert.ok(MANUAL.includes('revalidação humana final deste baseline permanece **PENDENTE**'));
  assert.ok(MANUAL.includes('**Resultado da aceitação:** [ ] APROVADO'));
  assert.ok(RELEASE.includes('revalidação humana do `main` pós-PR87 ainda é necessária'));
  assert.ok(RELEASE.includes('Baseline funcional atual — pós-PR87'));
  assert.ok(RELEASE.includes('run **#270**'));
  assert.ok(RELEASE.includes('TAM3720, GLO7634 e PSFBU'));
  assert.ok(AI.includes('aceitação humana foi **parcial**'));
});

test('roadmap e changelog registram refinamentos concluídos e próximos passos', () => {
  assert.ok(ROADMAP.includes('24/09/2026'));
  assert.ok(ROADMAP.includes('Evolução visual V1–V11'));
  assert.ok(ROADMAP.includes('PR #31 — tipografia nativa'));
  assert.ok(ROADMAP.includes('PR #32 — cabeçalho do Quadro Atual'));
  assert.ok(ROADMAP.includes('PR #33 — sidebar da Rota Processada'));
  assert.ok(ROADMAP.includes('PR #34 — card ativo protegido'));
  assert.ok(ROADMAP.includes('PR #70 — colisão visual dos marcos densos'));
  assert.ok(ROADMAP.includes('TAM3720'));
  assert.ok(ROADMAP.includes('GLO7634'));
  assert.ok(ROADMAP.includes('PSFBU'));
  assert.ok(ROADMAP.includes('Não iniciar V12 automaticamente'));
  assert.ok(CHANGELOG.includes('PRs **#31–#34**'));
  assert.ok(CHANGELOG.includes('698/698 Node + 108/108 Playwright'));
});

test('aceitação manual cobre breakpoints, fluxos protegidos e baseline atual pós-PR87', () => {
  assert.ok(MANUAL.includes('1600×900'));
  assert.ok(MANUAL.includes('1100×820'));
  assert.ok(MANUAL.includes('Abaixo de 900 px'));
  assert.ok(MANUAL.includes('PR31 / tipografia nativa'));
  assert.ok(MANUAL.includes('PR32 / cabeçalho do Quadro Atual'));
  assert.ok(MANUAL.includes('PR33 / scroll da Rota Processada'));
  assert.ok(MANUAL.includes('PR34 / cabeçalho sticky'));
  assert.ok(MANUAL.includes('PR70 / marcos densos'));
  assert.ok(MANUAL.includes('Baseline atual pós-PR87'));
  assert.ok(MANUAL.includes('135/135 Playwright'));
  assert.ok(MANUAL.includes('TAM3720'));
  assert.ok(MANUAL.includes('GLO7634'));
  assert.ok(MANUAL.includes('PSFBU'));
  assert.ok(MANUAL.includes('pending'));
  assert.ok(MANUAL.includes('Acompanhar timeline'));
  assert.ok(MANUAL.includes('waypoint atual'));
  assert.ok(MANUAL.includes('PADIL → IRISO → LIBEC → EGDOD → IBGAM → PMS → ILVES → MASVA'));
  assert.ok(MANUAL.includes('UMGUL → SBCT'));
});
