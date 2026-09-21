# FlightFlow Evolução

Linha independente de evolução visual e de experiência do FlightFlow. Parte do baseline funcional certificado do FlightFlow ATS, mas recebe redesigns e experimentos somente neste repositório.

## Separação do projeto

- `flightflow-ats`: referência funcional estável e encerrada para esta rodada de redesign;
- `flightflow-evolucao`: laboratório oficial de evolução visual/UX;
- mudanças visuais deste repositório não retornam automaticamente ao ATS;
- o núcleo temporal/espacial continua protegido pelos mesmos contratos até decisão explícita.

A evolução visual foi consolidada até a **V11 — Flight Situation Strip** e os quatro achados da primeira rodada de aceitação foram remediados nos PRs **#20–#23**, mantendo a direção aprovada de Mission Rail, Command Bar técnica, mapa dominante, Quadro Operacional à direita e Temporal Deck integrado.

## Estado do projeto

- **Release estável:** `v0.2.0`
- **Versão atual para validação:** `main` / `0.2.1-dev` — contém a evolução visual V1–V11 e as mudanças ainda não publicadas de produto
- **Execução:** aplicação web sem etapa obrigatória de build
- **Branch de referência:** `main`
- **Quality gates:** auditoria estática, inventário de funções, testes Node, disponibilidade do navegador e Playwright
- **Design System:** documentado em `docs/DESIGN_SYSTEM.md`
- **Estado técnico certificado:** documentado em `docs/AI_CURRENT_STATE.md`
- **Baseline funcional pós-remediação da aceitação:** `cd4adf92d726ed3a2dea0fe4fa23744b41784b4f` — quality gate pós-merge #90, **696/696 Node + 97/97 Playwright**
- **Baseline histórico V11:** `a27ffee33577d88536a3828f9f3cca97b47fc898` — workflow pós-merge #59, **675/675 Node + 79/79 Playwright**
- **Achados originais da aceitação:** tecnicamente encerrados pelos PRs #20 (navegação), #21 (colisões), #22 (Velox) e #23 (legibilidade)
- **Aceitação manual da versão atual:** `docs/MANUAL-ACCEPTANCE.md` — **revalidação final pós-PR23 pendente**
- **Modularização contínua:** encerrada após o PR #211; novas extrações só devem ocorrer quando houver necessidade funcional concreta

> **Importante para testar as mudanças mais recentes:** a release `v0.2.0` não contém a linha visual consolidada V1–V11. Para validar o estado atual do FlightFlow Evolução, use a branch `main`.

O projeto permanece em manutenção evolutiva. A rodada de modularização do ciclo v0.3.0 reduziu o acoplamento do núcleo e consolidou módulos já extraídos em `src/`, sem alterar os contratos temporais e espaciais protegidos.

## Baixar e executar a versão atual

Para testar o que está hoje em `main` — inclusive **Mission Rail V9**, **Living Operational Chart V10**, **Flight Situation Strip V11**, Dashboard moderno, Rota Processada e semântica pré-TER/TER — baixe a branch `main`, não o ZIP da release `v0.2.0`.

No GitHub, use **Code → Download ZIP** estando na branch `main`, ou clone o repositório normalmente. Depois, na pasta extraída:

```bash
npm install
npm start
```

Abra no navegador:

```text
http://127.0.0.1:4173
```

O servidor local usa apenas recursos nativos do Node.js e não adiciona dependências de runtime. Se estiver no Windows e o navegador mostrar uma versão antiga após atualizar os arquivos, faça um recarregamento forçado com **Ctrl+F5**.

Como alternativa, a aplicação também pode ser aberta diretamente pelo arquivo `index.html` em Chrome, Edge ou Firefox. Essa alternativa é útil para teste básico, mas o servidor local é preferível porque evita limitações do protocolo `file://` em recursos cartográficos e integrações.

Depois de abrir a aplicação:

1. confirme que o cabeçalho identifica o produto como **FlightFlow ATS · EVOLUÇÃO**;
2. confira Mission Rail, Command Bar, Flight Situation Strip, Carta Operacional, Quadro Operacional e Temporal Deck;
3. abra **Configurações → Aparência** e valide claro, escuro e **Dashboard moderno**;
4. carregue um histórico representativo e utilize timeline, mapa, Rota Processada, STRIP, FPV e demais ferramentas normalmente;
5. execute a rodada completa de aceitação em `docs/MANUAL-ACCEPTANCE.md` antes de qualquer nova release.

Alguns recursos cartográficos e consultas externas dependem de conectividade, mas o projeto também mantém dados e recursos locais.

## Desenvolvimento e verificação

Requisitos:

- Node.js 22+
- Python 3
- dependências do projeto instaladas com `npm install`

Verificação completa:

```bash
npm install
npm run check
```

O comando executa, em sequência:

1. **Static audit**
2. **Function declaration inventory**
3. testes de regressão Node
4. testes de interface Playwright

Os mesmos gates são exigidos pelo GitHub Actions em pull requests e pushes para `main`.

## Contratos críticos protegidos

Mudanças não podem introduzir regressões em:

- DEP como referência temporal;
- passagem por todos os fixos intermediários;
- aeronave exatamente sobre os checkpoints correspondentes;
- equivalência entre avanço e retrocesso;
- equivalência entre Próximo, Anterior, timeline, scrubber, teclado e autoplay;
- sequência crítica `PADIL → IRISO → LIBEC → EGDOD → IBGAM → PMS → ILVES → MASVA`;
- `ILVES 01:34` antes de `MASVA 01:36`;
- continuação declarada sem ETIM não pode receber tempo inventado;
- fechamento por Ordem TER deve permanecer explicitamente derivado/não histórico e sem ETIM/STAR/fixos fabricados;
- fechamento do perfil de rota no destino esperado quando houver evidência operacional aplicável.

Consulte `docs/REGRESSION-CHECKLIST.md` e `docs/RELEASE-READINESS.md`.

## Estrutura do repositório

```text
.
├── index.html              # aplicação e orquestração principal
├── src/                    # módulos por domínio
├── tests/                  # contratos Node e regressões E2E/Playwright
├── docs/                   # arquitetura, operação, regressão, Design System e histórico técnico
├── tools/                  # auditoria estática e inventário
├── .github/                # workflow e template de pull request
├── AGENTS.md               # regras para agentes automatizados
├── CHANGELOG.md            # histórico de versões
├── package.json            # scripts e dependências de desenvolvimento
└── playwright.config.js    # configuração E2E
```

Um mapa da documentação está disponível em `docs/README.md`. Para mudanças de interface, consulte também `docs/DESIGN_SYSTEM.md` antes de criar novos estilos ou componentes.

## Princípio de desenvolvimento

Toda mudança deve seguir:

**entender → reproduzir → alterar minimamente → verificar → revisar → registrar**

Não abrir novas rodadas de remapeamento/refatoração automaticamente. O trabalho futuro deve ser motivado por bug, melhoria funcional, manutenção necessária ou preparação de release.

## Contribuição e segurança

Consulte `CONTRIBUTING.md` antes de abrir mudanças e `SECURITY.md` para orientações sobre conteúdo sensível e relato de vulnerabilidades.

Branches temporárias encerradas são higienizadas automaticamente pelo workflow de housekeeping; branches `release/*`, protegidas, abertas ou sem histórico de PR fechado são preservadas.

## Release Readiness

Para qualquer nova versão estável:

1. todos os quality gates devem estar verdes no mesmo SHA;
2. o Playwright deve terminar sem `flaky`, retry ou `SPATIAL_EQ_DIAG`;
3. a aceitação operacional aplicável deve estar registrada;
4. não pode haver regressão crítica conhecida aberta;
5. documentação e changelog devem refletir o comportamento entregue.

## Segurança e publicação

O repositório é público. Portanto:

- não versionar credenciais, tokens, chaves ou segredos;
- não adicionar dados pessoais desnecessários;
- revisar qualquer novo conteúdo operacional antes do commit;
- manter arquivos locais sensíveis fora do Git e cobertos por `.gitignore`.

## Histórico

A release `v0.2.0` e o histórico de evolução estão documentados em `CHANGELOG.md`. O estado técnico mais recente para continuidade assistida por IA fica em `docs/AI_CURRENT_STATE.md`.
