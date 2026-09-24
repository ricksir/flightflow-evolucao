# Roadmap técnico — FlightFlow Evolução

> Estado revisado em **24/09/2026**, após o fechamento técnico dos refinamentos e contratos operacionais até o **PR70**.

## Estado atual

A rodada principal de evolução visual, as remediações de aceitação e os contratos APP/sessão estão tecnicamente concluídos até o PR70. O baseline funcional certificado é:

`ff6f2e7a63e475ae80caa1a54b28e0eb2440eaf2`

Certificação pós-merge do baseline funcional:

- quality gate **#232**: sucesso;
- **134/134** testes Playwright;
- zero `failed`, `flaky`, `retry`, `timeout`, `AssertionError`, `SPATIAL_EQ_DIAG` e `not ok` no log bruto;
- housekeeping **#70**: sucesso;
- PRs documentais posteriores não alteram o comportamento funcional certificado.

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
- [x] housekeeping #36 e remoção da branch temporária;
- [x] PRs #36–#40 — Rota Processada, Dados do Plano, Mission Rail, shell superior e Temporal Deck;
- [x] PRs #54–#68 — contratos TAM3720, GLO7634, PSFBU e troca de sessão `pending` → `Ler e iniciar`;
- [x] PR #70 — colisão visual dos marcos densos da timeline inferior corrigida sem alterar `buildTimeline()` ou `goTo()`;
- [x] quality gate #232 verde no pós-merge do PR70;
- [x] housekeeping #70 concluído.

## Rodada de fechamento

### 1. Documentação

- [x] sincronizar README, Roadmap, estado técnico, Release Readiness e roteiro de aceitação com o fechamento até PR70;
- [x] manter a release publicada `v0.2.0` distinta da linha de desenvolvimento atual;
- [x] registrar o fechamento técnico sem declarar revalidação humana inexistente.

### 2. Revalidação manual final — pendente

Reexecutar `docs/MANUAL-ACCEPTANCE.md` no `main` pós-PR70, com históricos representativos, e registrar o resultado. A validação humana anterior direcionou remediações posteriores, mas ainda falta o reteste final do candidato atual. Gates automatizados e aceitações anteriores não equivalem à aprovação do estado atual.

Obrigatório antes de nova release:

- [ ] validar visualmente 1600×900;
- [ ] validar 1100×820;
- [ ] validar fluxo abaixo de 900 px;
- [ ] validar temas claro, escuro e Dashboard moderno;
- [ ] validar TAM3774 e o fechamento terminal pré-TER/TER;
- [ ] validar TAM3720, GLO7634 e PSFBU;
- [ ] validar seleção `pending` → `Ler e iniciar`, inclusive autoplay já em andamento;
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
