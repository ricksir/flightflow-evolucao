# Roadmap técnico — FlightFlow Evolução

> Estado revisado em **22/09/2026**, após o fechamento técnico dos refinamentos de aceitação até o **PR34**.

## Estado atual

A rodada principal de evolução visual e os refinamentos derivados das aceitações humanas estão tecnicamente concluídos até o PR34. O baseline funcional certificado é:

`2d3ebd01b888f5760abe4ddd3d46ba287de0b782`

Certificação pós-merge atual:

- quality gate **#124**: sucesso;
- **698/698** testes Node;
- **108/108** testes Playwright;
- zero `failed`, `flaky`, `retry`, `timeout`, `AssertionError`, `SPATIAL_EQ_DIAG` e `not ok`;
- housekeeping **#36**: sucesso;
- branch temporária do PR34 removida.

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

### Remediação e refinamentos pós-aceitação

- [x] PR #20 — navegação lateral e feedback de estado;
- [x] PR #21 — sobreposições e colisões;
- [x] PR #22 — diferenciação do Dashboard moderno/Velox;
- [x] PR #23 — legibilidade, tipografia, contraste e refinamento dos cards;
- [x] quality gate #90 verde no pós-merge do PR23;
- [x] PR #25 — foco visual efetivo do Mapa;
- [x] PR #26 — legibilidade real do dashboard;
- [x] PR #27 — controles do mapa claros no tema claro;
- [x] PR #28 — Quadro Atual modernizado e alinhado a Alterações;
- [x] PR #29 — contrato visual de tema estabilizado sem mudança de produto;
- [x] quality gate #111 verde no pós-merge do PR29;
- [x] housekeeping #31 e remoção das branches temporárias;
- [x] PR #31 — tipografia nativa sem dependência externa;
- [x] PR #32 — cabeçalho do Quadro Atual sem duplicação/colisão;
- [x] PR #33 — sidebar da Rota Processada acompanha o waypoint atual;
- [x] PR #34 — card ativo protegido contra o cabeçalho sticky;
- [x] quality gate #124 verde no pós-merge do PR34;
- [x] housekeeping #36 e remoção da branch temporária.

## Rodada de fechamento

### 1. Documentação

- [x] sincronizar README, Roadmap, estado técnico, changelog, Release Readiness e roteiro de aceitação com o fechamento PR20–PR23;
- [x] manter a release publicada `v0.2.0` distinta da linha de desenvolvimento atual;
- [x] registrar o fechamento técnico sem declarar revalidação humana inexistente.

### 2. Revalidação manual final — pendente

Reexecutar `docs/MANUAL-ACCEPTANCE.md` no `main` pós-PR34, com histórico representativo, e registrar o resultado. A validação humana já identificou e direcionou PR32–PR34, mas ainda falta o reteste final do candidato atual. A aceitação anterior encontrou os quatro achados já corrigidos e não equivale à aprovação do estado atual.

Obrigatório antes de nova release:

- [ ] validar visualmente 1600×900;
- [ ] validar 1100×820;
- [ ] validar fluxo abaixo de 900 px;
- [ ] validar temas claro, escuro e Dashboard moderno;
- [ ] validar TAM3774 e o fechamento terminal pré-TER/TER;
- [ ] validar Próximo/Anterior/timeline/scrubber/teclado/autoplay;
- [ ] validar Rota Processada, inclusive scroll automático do ponto atual e cabeçalho sticky;
- [ ] validar STRIP e FPV;
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
