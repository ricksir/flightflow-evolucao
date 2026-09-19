# Roadmap técnico — FlightFlow Evolução

> Estado revisado em **19/09/2026**, após a certificação pós-merge da **V11 — Flight Situation Strip**.

## Estado atual

A rodada principal de evolução visual está tecnicamente concluída. O último SHA funcional certificado é:

`a27ffee33577d88536a3828f9f3cca97b47fc898`

Certificação pós-merge:

- workflow **#59**: sucesso;
- **675/675** testes Node;
- **79/79** testes Playwright;
- zero `failed`, `flaky`, `retry`, `timeout`, `uncaught`, `SPATIAL_EQ_DIAG`, `not ok` e `AssertionError`;
- housekeeping **#16**: sucesso;
- nenhuma branch temporária da V11 permaneceu aberta.

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

## Rodada de fechamento

### 1. Documentação

- [x] sincronizar README, Roadmap, estado técnico, changelog e Release Readiness com a V11;
- [x] manter a release publicada `v0.2.0` distinta da linha de desenvolvimento atual;
- [x] registrar a automação V11 como concluída sem declarar aceitação humana inexistente.

### 2. Aceitação manual — pendente

Executar `docs/MANUAL-ACCEPTANCE.md` com histórico representativo e registrar o resultado.

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
