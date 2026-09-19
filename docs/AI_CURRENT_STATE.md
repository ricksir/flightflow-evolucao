# FlightFlow Evolução — AI Current State

> Checkpoint técnico para continuidade entre conversas/agentes.
>
> Atualizado em **19/09/2026**, após a certificação pós-merge da **V11 — Flight Situation Strip**.
>
> **Fase atual: FECHAMENTO, ACEITAÇÃO MANUAL e preparação de release.**

## 1. Fonte de verdade

- Repositório de evolução: `ricksir/flightflow-evolucao`.
- Branch principal: `main`.
- Repositório estável/fechado anterior: `ricksir/flightflow-ats` — **não alterar nesta linha de trabalho**.
- Baseline de origem da evolução: `b2bb9acc03096beeebbd36098b8008ef81639df8`.
- Último SHA funcional V11 certificado:
  `a27ffee33577d88536a3828f9f3cca97b47fc898`.
- O topo real de `main` pode conter commits exclusivamente documentais posteriores; sempre conferir o SHA atual antes de escrever.
- Release estável publicada herdada: `v0.2.0`.
- Linha atual de desenvolvimento: `0.2.1-dev`.
- A próxima release **não deve ser publicada** antes da aceitação manual registrada.

## 2. Certificação atual

### V11 — Flight Situation Strip

PR #15:

- head certificado: `e8802b56eee24a6b6f3fc3776170a4339678ef8f`;
- workflow de PR **#58**: sucesso;
- **675/675 Node**;
- **79/79 Playwright**;
- zero `failed`, `flaky`, `retry`, `timeout`, `uncaught`, `SPATIAL_EQ_DIAG`, `not ok` e `AssertionError`.

Pós-merge:

- SHA funcional em `main`: `a27ffee33577d88536a3828f9f3cca97b47fc898`;
- workflow **#59**: sucesso;
- **675/675 Node**;
- **79/79 Playwright**;
- todos os contadores críticos em zero;
- housekeeping **#16**: sucesso;
- branch `feat/flight-situation-strip-v11` removida;
- nenhum PR funcional permaneceu aberto ao final da certificação.

### V10 — Living Operational Chart

O PR #13 foi mergeado externamente enquanto o CI ainda estava vermelho. A correção foi tratada em hotfix separado:

- PR #14;
- head `86a334a4b8d2f7f0386cf6510c1849aa5deaff4d`;
- workflow #56: sucesso;
- **672/672 Node + 77/77 Playwright**;
- merge do hotfix: `f779b5204d8123146683fef17f62fff97dad08fb`;
- pós-merge workflow #57: sucesso;
- housekeeping #15: sucesso.

Regra: **sempre revalidar PR e `main` imediatamente antes de qualquer escrita ou merge**, porque automações externas podem avançar o repositório.

## 3. Evolução visual consolidada

A sequência visual principal está concluída:

1. Pilot Shell V1;
2. Pilot Shell V2;
3. Operational Map V3;
4. Pilot Shell V4;
5. Operational Board V5;
6. Temporal Deck V6;
7. Operational Command Bar V7;
8. Workspace Composition V8;
9. Mission Rail V9;
10. Living Operational Chart V10;
11. Flight Situation Strip V11.

Direção visual consolidada:

- Mission Rail escuro;
- Command Bar escura;
- mapa central dominante;
- Quadro Operacional à direita;
- Temporal Deck escuro na base;
- Flight Situation Strip acima da carta;
- tema claro preservando a superfície cartográfica clara;
- Dashboard moderno/Velox alterando chrome e acento, não a semântica ATS.

## 4. Fronteiras protegidas

### Núcleo temporal e espacial

Preservar:

- DEP como referência temporal;
- nenhum fixo intermediário pulado;
- aeronave exatamente sobre o checkpoint correspondente;
- avanço e retrocesso pela mesma geometria em sentidos opostos;
- equivalência entre Próximo, Anterior, timeline, scrubber, teclado e autoplay;
- troca de histórico sem resíduos da sessão anterior.

Sequência crítica:

`PADIL → IRISO → LIBEC → EGDOD → IBGAM → PMS → ILVES → MASVA`

Com:

- `ILVES 01:34` antes de `MASVA 01:36`;
- retrocesso fiel em ordem inversa.

### buildTimeline()

`src/timeline/timeline-builder-controller.js` permanece congelado por contrato de bytes/linhas/SHA/dependências. Não alterar sem decisão explícita e validação dedicada.

### goTo()

Não alterar `goTo()` sem:

1. necessidade funcional concreta;
2. teste dedicado;
3. comparação explícita de todos os caminhos de navegação;
4. certificação completa antes e depois do merge.

Preservar também `replaceChildren()` + `queueMicrotask()` nas transições protegidas.

## 5. TAM3774 e terminal

Cenário protegido:

- ADEP: SBBR;
- ADES: SBCT;
- rota declarada: KUKOL UZ5 UMGUL;
- histórico processado preservado até IMTBI;
- continuação publicada sem ETIM: VULRU → UBNID → GIKLU → USVIG → UMGUL;
- fechamento terminal: UMGUL → SBCT;
- ARP oficial SBCT: 253154S 0491034W.

Semântica:

- antes de TER: terminal pode aparecer como preview, mas a aeronave não deve avançar antecipadamente ao ADES;
- no TER: fechamento pode ficar ativo e terminar no ADES;
- não inventar ETIM, CFL, STAR, fixos intermediários ou horários;
- retrocesso do TER deve restaurar exatamente o estado anterior.

ETIM é alias visual/operacional. A abreviação normativa usada na MCA 100-27/2025 é ETO — Hora Estimada de Sobrevoo.

## 6. Estado da rodada de fechamento

### Automatizado — concluído

- V11 mergeada;
- quality gates verdes;
- log bruto auditado;
- housekeeping concluído;
- documentação sendo sincronizada nesta rodada.

### Humano — pendente

A automação **não substitui** a aceitação visual/operacional.

Executar `docs/MANUAL-ACCEPTANCE.md` antes de declarar nova versão estável.

Até essa aprovação:

- não marcar a rodada como aceita manualmente;
- não criar tag/release;
- não iniciar V12 automaticamente apenas por sequência.

## 7. Próximos passos

1. concluir esta rodada documental;
2. baixar/abrir a `main` atual;
3. executar a aceitação manual em histórico representativo;
4. registrar qualquer divergência com evidência;
5. corrigir apenas bugs reproduzíveis;
6. quando a aceitação estiver concluída, escolher versão e executar Release Readiness;
7. publicar release somente com gates e aceitação no mesmo candidato lógico.

## 8. Protocolo de continuidade

Antes de nova mudança:

1. conferir SHA real de `main`;
2. conferir PRs abertos;
3. conferir workflows recentes;
4. conferir este arquivo;
5. reproduzir o objetivo/problema;
6. criar branch pequena;
7. criar/ajustar contrato;
8. executar todos os gates;
9. ler log bruto;
10. merge somente se verde;
11. repetir gates no novo `main`;
12. confirmar housekeeping.
