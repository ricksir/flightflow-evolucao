# Release Readiness — FlightFlow Evolução

> **Status:** a release `v0.2.0` já foi publicada. A linha atual `main` / `0.2.1-dev` contém a evolução visual até a **V11**, os refinamentos de aceitação até o **PR70** e os contratos APP/sessão consolidados. Uma **revalidação humana final registrada** continua obrigatória antes de qualquer nova release.

Este documento define quando o FlightFlow ATS pode ser considerado pronto para uma versão estável.



## Baseline funcional atual — pós-PR70

Baseline funcional certificado:

`ff6f2e7a63e475ae80caa1a54b28e0eb2440eaf2`

Evidência automatizada pós-merge:

- quality gate **#232**: sucesso;
- **134/134 Playwright**;
- zero `failed`, `flaky`, `retry`, `timeout`, `AssertionError`, `not ok` e `SPATIAL_EQ_DIAG` no log bruto;
- housekeeping **#70**: sucesso.

PRs documentais posteriores não alteram esse baseline funcional; qualquer candidato de release deve ser novamente certificado no SHA efetivamente escolhido.

A rodada de fechamento acumulou, sem alterar os contratos temporais/espaciais protegidos:

- PRs #25–#34 — foco do Mapa, legibilidade, tema claro, Quadro Atual, tipografia e acompanhamento da Rota Processada;
- PRs #36–#40 — progresso/scroll da Rota Processada, Dados do Plano, Mission Rail recolhível, compactação do shell e Temporal Deck contínuo;
- PRs #54–#68 — TAM3720, GLO7634, PSFBU, isolamento entre sessões e equivalência de navegação durante seleção `pending`;
- PR #70 — correção da colisão visual dos marcos densos da timeline inferior, preservando todos os ticks.

A revalidação humana do novo `main` ainda é necessária antes de uma release.

## Baseline histórico — V11

Último SHA funcional certificado:

`a27ffee33577d88536a3828f9f3cca97b47fc898`

Evidência automatizada pós-merge:

- workflow **#59**: sucesso;
- **675/675 Node**;
- **79/79 Playwright**;
- zero `failed`, `flaky`, `retry`, `timeout`, `uncaught`, `SPATIAL_EQ_DIAG`, `not ok` e `AssertionError`;
- housekeeping **#16**: sucesso.

Essa evidência encerra a validação automatizada da V11, mas **não equivale a aceitação manual**. O roteiro humano obrigatório está em `docs/MANUAL-ACCEPTANCE.md`.

A rodada V1–V11 consolidou, sem substituir o núcleo temporal/espacial:

- Operational Board V5;
- Temporal Deck V6;
- Operational Command Bar V7;
- Workspace Composition V8;
- Mission Rail V9;
- Living Operational Chart V10;
- Flight Situation Strip V11.

## Estado de referência

- Branch de referência: `main`.
- Baseline arquitetural protegido pelo teste `tests/main-kernel-contract.test.js`.
- A aplicação continua executável diretamente por `index.html`, sem etapa de build.
- Os módulos extraídos vivem em `src/` e são carregados explicitamente antes do núcleo principal.
- Toda mudança em `main` deve passar pelos quality gates do GitHub Actions.

## Gates obrigatórios

Um commit candidato a release só pode ser aceito quando todos os gates abaixo estiverem verdes:

1. **Static audit** — `npm run audit`.
2. **Function declaration inventory** — `npm run inventory`.
3. **Node regression tests** — `npm test`.
4. **Browser availability** — Google Chrome disponível no runner.
5. **Playwright UI regression tests** — `npm run test:ui`.

Além do status verde do workflow, o log bruto do Playwright deve terminar sem `flaky`, sem retry e sem `SPATIAL_EQ_DIAG`.

## Invariantes de voo protegidos

A release não pode alterar estes contratos sem uma decisão explícita e novos testes equivalentes:

- DEP permanece como referência temporal do perfil de movimento.
- Nenhum fixo intermediário pode ser pulado.
- A aeronave deve ser renderizada sobre o fixo correspondente quando esse checkpoint é cruzado.
- Avanço e retrocesso devem percorrer a mesma geometria em sentidos opostos.
- Próximo, Anterior, timeline, scrubber, teclado e autoplay devem convergir para o mesmo estado lógico/espacial.
- O trecho crítico 78 → 79 preserva, nesta ordem:

`PADIL → IRISO → LIBEC → EGDOD → IBGAM → PMS → ILVES → MASVA`

- `ILVES 01:34` deve permanecer antes de `MASVA 01:36`.
- O retrocesso 79 → 78 deve usar a sequência inversa.
- O perfil de rota crítico deve iniciar no ADEP `SBBS`, manter `MASVA` como último fixo antes do destino e terminar no ADES `SBPJ` em 100% de progresso.

## Evidência automatizada atual

Os contratos acima são cobertos, entre outros, por:

- `tests/route-regression.test.js`;
- `tests/e2e/aircraft-fix-spatial-regression.spec.js`;
- `tests/e2e/navigation-spatial-equivalence.spec.js`;
- `tests/e2e/ui-navigation.spec.js`;
- `tests/e2e/keyboard-navigation-contract.spec.js`;
- `tests/e2e/playback-controller.spec.js`;
- `tests/e2e/transport-navigation-contract.spec.js`;
- `tests/go-to-transition-contract.test.js`;
- `tests/render-current-orchestration-contract.test.js`.

A troca real de arquivo também é exercitada em `tests/e2e/ui-navigation.spec.js`: o cenário injeta estado derivado da sessão anterior, seleciona um segundo histórico, confirma o reset `pending`, carrega o novo arquivo e verifica que a nova sessão começa no evento 1 sem snapshots, perfil de movimento ou rota processada marcados como resíduos da sessão anterior.

O mesmo arquivo E2E também cobre o uso normal dos painéis operacionais STRIP e FPV: abertura pelos toggles, preenchimento com callsign/origem/destino, reconhecimento de alterações da STRIP, minimização/restauração e atualização dos painéis durante Próximo/Anterior.

O teste `tests/route-regression.test.js` afirma ainda o fechamento geográfico do cenário crítico: início em `SBBS`, `MASVA` como último fixo, término em `SBPJ`, fração final 100% e evento de ARR/término como marco final do perfil.

Também existem regressões baseadas em históricos operacionais representativos para:

- rota multilinha GLO7634;
- passagem de data/meia-noite TAM3774;
- atualização de IDPLANO PSFBU.

Esses casos estão em `tests/real-plan-route-regressions.test.js` e testes relacionados.

## Aceitação manual antes da versão estável

A automação não substitui a validação do produto com históricos representativos. Para o baseline funcional pós-PR70 e o `main` documentalmente sincronizado, reexecutar integralmente `docs/MANUAL-ACCEPTANCE.md` e registrar o SHA testado, navegador, resoluções e históricos utilizados. A execução anterior e os gates automatizados não devem ser reutilizados como aprovação humana do estado atual. Antes de criar a versão estável, executar e registrar:

- [ ] carregar pelo menos um histórico real representativo sem erro fatal;
- [ ] validar DEP e evolução temporal;
- [ ] validar Próximo e Anterior em um trecho com vários fixos;
- [ ] validar timeline e scrubber no mesmo instante;
- [ ] validar teclado;
- [ ] validar autoplay;
- [ ] confirmar que a aeronave passa pelos fixos esperados;
- [ ] trocar de histórico e confirmar que não há resíduo de rota/eventos anteriores;
- [ ] validar seleção `pending` e confirmar que a sessão ativa permanece navegável até `Ler e iniciar`;
- [ ] validar TAM3720, GLO7634 e PSFBU conforme os contratos do roteiro manual;
- [ ] validar origem, destino e último fixo;
- [ ] validar STRIP e painéis operacionais usados no fluxo normal;
- [ ] executar `npm run check` no commit candidato;
- [ ] revisar o log bruto do Playwright.

## Critérios para declarar a fase concluída

A fase Release Readiness termina quando:

1. os gates automatizados estão verdes no mesmo SHA candidato;
2. a aceitação manual acima está registrada como concluída;
3. não existe regressão crítica conhecida aberta;
4. a documentação de execução/testes está coerente com o estado atual;
5. o commit candidato é marcado como versão estável.

A modularização adicional do `index.html` não é requisito de release. A rodada contínua foi encerrada após o PR #211; novas extrações só devem ocorrer quando houver necessidade concreta de produto, correção ou manutenção.
