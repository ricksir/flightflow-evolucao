# Roadmap técnico — FlightFlow Evolução

> Estado revisado em **21/09/2026**, após o fechamento técnico da remediação de aceitação nos PRs **#20–#23**.

## Estado atual

A rodada principal de evolução visual e a remediação dos quatro achados da primeira aceitação estão tecnicamente concluídas. O baseline funcional pós-remediação é:

`cd4adf92d726ed3a2dea0fe4fa23744b41784b4f`

Certificação pós-merge atual:

- quality gate **#90**: sucesso;
- **696/696** testes Node;
- **97/97** testes Playwright;
- zero `failed`, `flaky`, `retry`, `TimeoutError`, `AssertionError`, `SPATIAL_EQ_DIAG` e `not ok`;
- housekeeping **#24**: sucesso;
- branch `fix/pr23-legibility-card-refinement` removida.

Baseline histórico V11: `a27ffee33577d88536a3828f9f3cca97b47fc898`, workflow #59, **675/675 Node + 79/79 Playwright**.

## Concluído

### Base e proteção

- [x] auditoria estática e inventário de funções;
- [x] quality gates no GitHub Actions;
- [x] regressões Node e Playwright;
- [x] contratos temporais e espaciais críticos;
- [x] proteção da equivalência Próximo/Anterior/timeline/scrubber/teclado/autoplay;
- [x] proteção de DEP, checkpoints e retrocesso fiel;
- [x] modularização contínua encerrada.

### Evolução visual V1–V11

- [x] Pilot Shell V1/V2;
- [x] Operational Map V3;
- [x] Pilot Shell V4;
- [x] Operational Board V5;
- [x] Temporal Deck V6;
- [x] Operational Command Bar V7;
- [x] Workspace Composition V8;
- [x] Mission Rail V9;
- [x] Living Operational Chart V10;
- [x] Flight Situation Strip V11.

### Remediação da aceitação original

- [x] PR #20 — navegação lateral e feedback de estado;
- [x] PR #21 — sobreposições e colisões;
- [x] PR #22 — diferenciação do Dashboard moderno/Velox;
- [x] PR #23 — legibilidade, tipografia, contraste e refinamento dos cards;
- [x] quality gate #90 verde no pós-merge do PR23;
- [x] housekeeping #24 e remoção da branch do PR23.

## Rodada de fechamento

### 1. Documentação

- [x] sincronizar README, Roadmap, estado técnico, changelog, Release Readiness e roteiro de aceitação com o fechamento PR20–PR23;
- [x] manter a release publicada `v0.2.0` distinta da linha de desenvolvimento atual;
- [x] registrar o fechamento técnico sem declarar revalidação humana inexistente.

### 2. Revalidação manual final — pendente

Reexecutar `docs/MANUAL-ACCEPTANCE.md` no `main` pós-PR23, com histórico representativo, e registrar o resultado. A aceitação anterior encontrou os quatro achados já corrigidos e não equivale à aprovação do estado atual.

Obrigatório antes de nova release:

- [ ] validar visualmente 1600×900;
- [ ] validar 1100×820;
- [ ] validar fluxo abaixo de 900 px;
- [ ] validar temas claro, escuro e Dashboard moderno;
- [ ] validar TAM3774 e o fechamento terminal pré-TER/TER;
- [ ] validar Próximo/Anterior/timeline/scrubber/teclado/autoplay;
- [ ] validar Rota Processada, STRIP e FPV;
- [ ] registrar divergências com screenshot/vídeo quando existirem.

### 3. Próxima release — somente após aceitação

- [ ] escolher o número da próxima versão;
- [ ] executar `docs/RELEASE-READINESS.md` no SHA candidato;
- [ ] garantir todos os gates verdes no mesmo SHA;
- [ ] registrar a aceitação manual;
- [ ] atualizar `CHANGELOG.md`;
- [ ] criar tag/release.

## Próximas evoluções opcionais

Somente após a rodada de aceitação manual, novas versões visuais podem tratar janelas e ferramentas secundárias, como Rota Processada, STRIP, FPV, configurações, modais e estados vazios/erro.

Não iniciar V12 automaticamente apenas para manter uma sequência numérica.

## Fora de escopo automático

- novo fresh remap;
- reescrita completa do frontend;
- alteração de `buildTimeline()` ou `goTo()` sem necessidade funcional concreta e testes dedicados;
- refatoração apenas para reduzir `index.html`;
- publicação de release sem aprovação manual.
