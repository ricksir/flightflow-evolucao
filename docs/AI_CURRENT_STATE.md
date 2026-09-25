# FlightFlow Evolução — AI Current State

> Checkpoint técnico para continuidade entre conversas/agentes.
>
> Atualizado em **25/09/2026**, após o fechamento técnico dos refinamentos APP/visuais até o PR **#87**.
>
> **Fase atual: REVALIDAÇÃO HUMANA FINAL e preparação de release, sem abertura automática de V12.**

## 1. Fonte de verdade

- Repositório de evolução: `ricksir/flightflow-evolucao`.
- Branch principal: `main`.
- Repositório estável/fechado anterior: `ricksir/flightflow-ats` — **não alterar nesta linha de trabalho**.
- Baseline de origem da evolução: `b2bb9acc03096beeebbd36098b8008ef81639df8`.
- Baseline funcional com quality gate **pós-merge** explicitamente registrado:
  `28b572f25527628f5db110f2f2765010b6f772ba`.
- Topo de `main` após o merge do PR **#87**:
  `cb9d97485ecb10606de223e8a18cc0a851120552`.
- Último gate integral auditado: PR **#87**, run **#270**, head `eb6369ccad71ae5e926f492ca7932fc88d33045f`, com **135/135 Playwright** e zero `failed`, `flaky`, `retry`, `timeout`, `AssertionError`, `not ok` e `SPATIAL_EQ_DIAG`.
- O merge `cb9d97485ecb10606de223e8a18cc0a851120552` foi comparado ao head certificado da PR87 e apresentou **0 arquivos diferentes**; portanto, o conteúdo funcional em `main` é equivalente ao conteúdo testado. O conector usado nesta rodada não enumera workflows disparados por `push`, então não se registra aqui um novo número de gate pós-merge.
- Baseline histórico V11:
  `a27ffee33577d88536a3828f9f3cca97b47fc898`.
- O topo real de `main` pode conter commits exclusivamente documentais posteriores; sempre conferir o SHA atual antes de escrever.
- Release estável publicada herdada: `v0.2.0`.
- Linha atual de desenvolvimento: `0.2.1-dev`.
- A próxima release **não deve ser publicada** antes da aceitação manual registrada.

## 2. Certificação atual

### Rodada APP e troca de sessão — PRs #54 a #68

A rodada APP foi conduzida em PRs curtos, preservando as fronteiras temporal e espacial existentes:

- PRs **#54–#55** — TAM3720: proteção dos fixos da rota derivada no mapa principal e navegação evento a evento da Rota Processada;
- PRs **#56–#57** — GLO7634: APP limitado a **SBBR → MILIX**, com MILIX como Fixo Saída e sem extensão operacional até KMCO;
- PRs **#58–#59** — PSFBU: regra **SEM DEP = SEM MOVIMENTO** e reset espacial completo ao trocar de um APP em movimento para um histórico sem DEP;
- PRs **#60–#62** — troca de histórico: seleção `pending` preserva a sessão/Rota Processada atual até `Ler e iniciar`; ativação `source` limpa a sessão antiga; releitura do mesmo APP com outro nome é determinística; cursores voláteis não fazem parte da identidade estável da sessão;
- PRs **#63–#68** — equivalência durante `pending`: sessão atual continua navegável por Anterior/Próximo, ArrowLeft/ArrowRight, timeline, scrubber, autoplay, autoplay já em andamento e Home/End.

Contratos APP protegidos:

- **TAM3720** — sem quadro PONTOS/ETIM, usa DEP + rota publicada + velocidade para posição derivada; não fabricar ETIM;
- **GLO7634** — ETO/Fixo Saída não é ETIM; TER encerra a jurisdição em MILIX e não leva a aeronave a KMCO;
- **PSFBU** — sem DEP, a aeronave permanece na posição inicial mesmo com CNL/TER;
- selecionar arquivo novo **não** encerra a sessão atual; a troca real ocorre somente em `Ler e iniciar`;
- ao confirmar a nova leitura, o fluxo nativo interrompe playback anterior e inicia a nova sessão sem resíduos;
- `goTo()` e `buildTimeline()` permaneceram intactos durante esta rodada.

Fechamento observado:

- `main` pós-PR87: `cb9d97485ecb10606de223e8a18cc0a851120552`;
- run **#270** no head do PR87: sucesso, **135/135 Playwright**, contadores críticos em zero;
- comparação head PR87 → merge: **0 arquivos diferentes**;
- PR **#46** foi fechada sem merge por divergência do `main`; sua correção visual foi transplantada limpa e mergeada pela PR **#70**;
- nenhuma tag/release foi criada e nenhuma V12 foi iniciada.

### Fechamento técnico mais recente — PRs #36 a #41 e #43

A rodada final de aceitação foi dividida em mudanças curtas e isoladas:

- PR **#36** — scroll proporcional da Rota Processada, mantendo o waypoint atual visível sem aparentar fim prematuro em progresso intermediário;
- PR **#37** — correções de sobreposição/quebra de texto e destaque quente perceptível para cards de Dados do Plano com `ATUALIZADO`;
- PR **#38** — Mission Rail V9 recolhível no desktop, acessível e com ganho real de largura para mapa/workspace;
- PR **#39** — compactação do shell superior e alinhamento real da faixa estrutural da topbar;
- PR **#40** — barra inferior/Temporal Deck visualmente contínua, sem caixotes internos, preservando Play, anterior/próximo, scrubber, velocidade e toggles;
- PR **#41** — estabilização do teste quando a demonstração inicia em autoplay;
- PR **#42** — sincronização documental fechada **sem merge** porque seu gate revelou 1 flaky/retry;
- PR **#43** — estabilização adicional do teste após Restart, sem alteração de código funcional.

Fechamento certificado:

- SHA funcional pós-merge: `28b572f25527628f5db110f2f2765010b6f772ba`;
- quality gate pós-merge **#149**: sucesso;
- **699/699 Node**;
- **115/115 Playwright**;
- zero `failed`, `flaky`, `retry`, `timeout`, `AssertionError`, `not ok` e `SPATIAL_EQ_DIAG`;
- housekeeping **#44**: sucesso;
- nenhum PR aberto no fechamento;
- nenhuma release/tag criada e nenhuma V12 iniciada.

A automação certifica o estado técnico, mas a aceitação humana final continua obrigatória antes de release.

### Fechamento técnico mais recente — PRs #31 a #34

Após o ciclo PR25–PR29, a aceitação humana continuou sobre a `main` e gerou correções curtas e isoladas:

- PR **#31** — substituição da dependência implícita de uma Inter não carregada por tipografia nativa variável, sem dependência de rede;
- PR **#32** — correção do cabeçalho do Quadro Atual: remoção do pseudo-texto duplicado e proteção de títulos operacionais longos contra colisão com os cards;
- PR **#33** — a lista lateral da Rota Processada passa a marcar o waypoint atual e acompanhar automaticamente o scroll quando segue a timeline;
- PR **#34** — o scroll da Rota Processada passa a considerar o cabeçalho sticky, evitando que o card atual fique visualmente encoberto.

Fechamento certificado:

- SHA funcional pós-merge: `2d3ebd01b888f5760abe4ddd3d46ba287de0b782`;
- quality gate pós-merge **#124**: sucesso;
- **698/698 Node**;
- **108/108 Playwright**;
- zero `failed`, `flaky`, `retry`, `timeout`, `AssertionError`, `not ok` e `SPATIAL_EQ_DIAG`;
- housekeeping **#36**: sucesso;
- branch temporária do PR34 removida;
- nenhum PR permaneceu aberto no fechamento.

A aceitação humana foi **parcial**: os screenshots enviados permitiram identificar e corrigir PR32, e o uso real da Rota Processada revelou o problema corrigido em PR33/PR34. Ainda é necessário retestar a `main` pós-PR34 e concluir a matriz manual antes de qualquer release.

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

- V11 preservada e fronteiras temporal/espacial mantidas;
- PRs #36–#41 e #43 concluíram a rodada final de remediação visual/funcional em mudanças curtas e isoladas;
- PRs #54–#68 adicionaram/certificaram os contratos APP de rota derivada, Fixo Saída, ausência de movimento sem DEP, isolamento entre sessões e equivalência de navegação durante `pending`;
- PR #70 corrigiu a colisão visual dos marcos densos da timeline inferior, sem alterar `buildTimeline()`, `goTo()`, estado, navegação, rota, scrubber ou autoplay;
- Rota Processada, Dados do Plano, Mission Rail, shell superior, Temporal Deck e fluxos APP possuem regressões específicas;
- quality gate pós-merge #149 permanece como último gate pós-merge explicitamente registrado do baseline `28b572f25527628f5db110f2f2765010b6f772ba`;
- run #231 do head do PR70 ficou verde com **134/134 Playwright** e contadores críticos em zero antes do merge para `ff6f2e7a63e475ae80caa1a54b28e0eb2440eaf2`;
- housekeeping histórico #44 concluído;
- PR #46 está fechada sem merge e substituída pela PR #70.

### Humano — revalidação final pendente

A automação **não substitui** a aceitação visual/operacional. É necessário reexecutar `docs/MANUAL-ACCEPTANCE.md` sobre o `main` pós-PR87. O reteste prioritário deve cobrir: Rota Processada em progresso intermediário e avançado; Dados do Plano com campos atualizados; Mission Rail expandido/recolhido; dashboard completo após a compactação superior; barra inferior contínua nos temas claro, escuro e Velox; e os cenários APP TAM3720, GLO7634 e PSFBU, incluindo troca de arquivo em estado `pending`.

Até essa revalidação:

- não declarar a rodada aprovada manualmente;
- não criar tag/release;
- não iniciar V12 automaticamente apenas por sequência.

## 7. Próximos passos

1. baixar/abrir a `main` atual;
2. reexecutar a aceitação manual com foco também nos quatro achados remediados;
3. registrar qualquer divergência com evidência;
4. corrigir apenas bugs reproduzíveis, em PRs pequenos;
5. quando a revalidação humana estiver concluída, escolher versão e executar Release Readiness;
6. publicar release somente com gates e aceitação no mesmo candidato lógico;
7. não criar V12 sem uma necessidade concreta de produto.

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
