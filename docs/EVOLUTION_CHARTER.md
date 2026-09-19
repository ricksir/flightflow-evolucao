# FlightFlow Evolução — Carta do Projeto

## Propósito

Este repositório é a linha independente de evolução visual e de experiência do FlightFlow.

O repositório `ricksir/flightflow-ats` permanece como referência funcional estável da aplicação anterior. O redesign não deve alterar aquele projeto.

## Baseline

O projeto nasceu do estado certificado:

`b2bb9acc03096beeebbd36098b8008ef81639df8`

## Pilot Shell V1

A primeira direção aprovada usa:

- navegação lateral escura e compacta;
- topbar técnica mais enxuta;
- mapa como protagonista;
- inspector operacional à direita;
- transporte/timeline integrado na base;
- superfície cartográfica clara;
- azul-petróleo como estrutura;
- vermelho para trajetória operacional;
- âmbar para estados derivados/TER.

## Regra de segurança

A fase inicial é visual. Não alterar sem necessidade funcional comprovada:

- `goTo()`;
- parser de históricos;
- referência temporal DEP;
- geometria de rota;
- checkpoints;
- equivalência Próximo/Anterior/timeline/scrubber/teclado/autoplay;
- semântica preview/active da Ordem TER;
- `replaceChildren()` e `queueMicrotask()` usados nas transições protegidas.

## Princípio visual

**Carta operacional viva**

- mapa = carta operacional;
- inspector = quadro/strip board;
- timeline = registro temporal;
- controles = suporte ao trabalho, não protagonistas.

## Critérios do piloto

O piloto deve:

1. ser reconhecível como FlightFlow;
2. reduzir o excesso de caixas e cápsulas;
3. preservar legibilidade em alta densidade;
4. manter o mapa dominante;
5. funcionar em tema claro e escuro;
6. respeitar foco de teclado e `prefers-reduced-motion`;
7. preservar todos os gates automatizados do baseline.


## Pilot Shell V2

A segunda rodada refina a hierarquia do piloto sem criar uma segunda lógica de aplicação:

- cabeçalho do voo tratado como faixa operacional;
- estado do voo agrupado e identificado;
- ferramentas do mapa compactadas em um dock técnico;
- Quadro Atual aproximado de um strip board, com menos caixas;
- alterações continuam sinalizadas por âmbar;
- lista de eventos usa trilho cronológico mais direto;
- transporte dá protagonismo ao scrubber e ao horário/evento;
- claro, escuro e Dashboard moderno compartilham a mesma gramática visual.

A V2 continua sem alterar motor temporal, parser, geometria ou navegação.


## Operational Map V3

A terceira rodada estabelece uma gramática cartográfica explícita:

- **histórico processado:** vermelho sólido;
- **continuação publicada sem ETIM:** azul técnico tracejado;
- **terminal previsto:** âmbar tracejado;
- **terminal ativo após Ordem TER:** âmbar sólido;
- **ADES:** marcador terminal próprio;
- **ponto atual/selecionado:** prioridade visual sobre os demais fixos.

A cartografia reduz peso de grid, leaders e metadata para preservar a rota como protagonista. A legenda passa a explicar separadamente preview e active do fechamento terminal.

A V3 é visual. A mesma geometria terminal e o mesmo estado `preview/active` continuam sendo calculados pelo núcleo já protegido.


## Pilot Shell V4

A quarta rodada aproxima o shell real do layout visual aprovado:

- identidade **FlightFlow ATS · EVOLUÇÃO** explícita no topo;
- rail lateral organizado por Operação e Suporte;
- Quadro Operacional com tabs contínuas, menos parecidas com botões;
- marcos **DEP / TRF / TER** destacados na lista de eventos;
- os mesmos marcos aparecem sobre o scrubber da timeline inferior;
- o evento TER ativo recebe destaque âmbar também no estado operacional do cabeçalho.

### Fronteira arquitetural

`buildTimeline()` permanece congelado e inalterado.

Os marcos V4 são aplicados por `src/ui/evolution-shell-v4.js` como uma camada visual pós-renderização. O módulo lê somente o DOM já produzido pela timeline e não chama `goTo()`, não altera `state.index`, não move aeronave e não participa da semântica `preview/active` do fechamento terminal.

## Operational Board V5

A quinta rodada concentra a evolução no painel direito, mantendo o shell V4 e toda a lógica operacional existente.

- o painel de dados passa a se apresentar visualmente como **QUADRO OPERACIONAL**;
- os campos deixam de parecer cartões independentes e passam a formar uma grade técnica contínua;
- labels operacionais recuperam tamanho mínimo legível de 10 px;
- valores usam alinhamento numérico estável e maior contraste;
- alterações continuam sinalizadas em âmbar, sem alterar o valor ou a origem do dado;
- ferramentas de organização permanecem disponíveis, porém visualmente secundárias;
- ações de mensagem/base normativa formam um rodapé integrado ao quadro;
- temas claro, escuro e Velox usam a mesma estrutura.

### Fronteira arquitetural

A V5 é CSS/documentação/testes. Não adiciona máquina de estados, não toca em `goTo()`, `state.index`, `buildTimeline()`, parser, geometria, `terminalClosureState()`, `replaceChildren()` ou `queueMicrotask()`.

O conteúdo e a ordem dos campos continuam sendo produzidos pelo renderer já existente; a V5 apenas reorganiza sua apresentação.

## Temporal Deck V6

A sexta rodada transforma a barra inferior em um **registro temporal operacional** mais próximo do layout aprovado.

- a timeline inferior passa a permanecer escura também no tema claro;
- o scrubber ocupa a área central dominante;
- os grupos de navegação e suporte ficam compactos e visualmente secundários;
- os horários inicial/final e o evento atual ganham hierarquia própria;
- o rótulo **LINHA DO TEMPO OPERACIONAL** passa ao mínimo legível de 9 px;
- os marcos DEP/TRF/TER deixam de usar microtexto de aproximadamente 6 px e passam a 9 px no desktop;
- o botão de reprodução continua destacado sem competir com o mapa;
- a paleta Velox altera somente o acento, preservando a mesma estrutura temporal.

### Fronteira arquitetural

A V6 é CSS/documentação/testes. Não modifica o HTML da barra, listeners, `scrubTransport()`, `restartTransport()`, `previousTransport()`, `nextTransport()`, `togglePlayback()`, `scheduleNext()`, `goTo()`, `state.index` ou `buildTimeline()`.

O `input#scrubber` original continua sendo a única autoridade de navegação por arraste. Os marcos V4 continuam apenas projetados visualmente sobre ele.

## Operational Command Bar V7

A sétima rodada consolida o cabeçalho como uma **barra de comando operacional**, mantendo a topbar escura em todos os temas.

- identidade FlightFlow permanece à esquerda como primeira zona;
- carregamento/origem do plano ocupa a zona central de trabalho;
- **ATS LIVE** funciona como estado compacto, não como cartão decorativo;
- ações globais formam um banco de comandos à direita;
- os grupos deixam de parecer cápsulas independentes e passam a ser separados por linhas técnicas;
- botões internos usam raio curto de 4 px, enquanto o contêiner externo preserva 16 px;
- nome do arquivo usa tipografia monoespaçada de metadata;
- o tema claro mantém o cabeçalho escuro para preservar a referência visual aprovada;
- Velox altera o acento, não a estrutura.

### Fronteira arquitetural

A V7 é CSS/documentação/testes. Não altera HTML, IDs, listeners, leitura de arquivo, parser, estado ATS, `goTo()`, timeline, scrubber, geometria ou fechamento terminal.

Os controles `fileInput`, `chooseFileBtn`, `readStartBtn`, `demoBtn`, `newFileBtn`, `exportBtn`, `configBtn`, `fullscreenBtn` e `helpBtn` continuam sendo exatamente os mesmos elementos funcionais.

## Workspace Composition V8

A oitava rodada consolida a composição aprovada em três áreas visuais no desktop:

**rail lateral / mapa central dominante / quadro operacional**

Regras:

- rail técnico reduzido para 84 px em desktop amplo;
- espaçamento estrutural de 8 px entre as áreas;
- quadro operacional limitado a 380 px, chegando a 390 px apenas em telas amplas;
- mapa ocupa todo o espaço remanescente e continua sendo o protagonista;
- workspace e inspector compartilham a mesma altura útil;
- margens internas do mapa são reduzidas sem alterar SVG, Leaflet, geometria ou rota;
- entre 901 e 1180 px, o quadro reduz para 340 px;
- abaixo de 901 px, a V8 não substitui a responsividade já existente.

### Fronteira arquitetural

A V8 é CSS/documentação/testes. Não altera HTML, parser, `goTo()`, `state.index`, timeline, scrubber, autoplay, teclado, geometria, `terminalClosureState()`, `buildTimeline()` ou a camada visual DEP/TRF/TER.

## Mission Rail V9

A nona rodada transforma a sidebar em **Mission Rail**, mantendo exatamente as âncoras de navegação existentes.

- identidade do rail passa a indicar `MISSION RAIL V9`;
- a largura definida pela Workspace V8 é preservada;
- itens assumem geometria técnica de 6 px;
- cada ícone passa a ocupar uma célula operacional de 28 px;
- o item ativo usa indicador linear de missão, sem cápsula dominante;
- hover e foco de teclado permanecem explícitos;
- a sidebar continua escura mesmo quando o tema geral está claro;
- a paleta Velox altera somente o acento.

A V9 não cria JavaScript, não recalcula item ativo e não altera destinos, listeners, estado, mapa, timeline ou geometria.



## Living Operational Chart V10

A décima rodada consolida a área central como **Carta Operacional Viva**, sem alterar qualquer cálculo cartográfico.

- o mapa permanece como maior superfície útil da aplicação;
- a moldura do mapa passa a usar geometria técnica curta, com raio de 9 px e borda fina;
- controles cartográficos existentes são compactados para 32 px e raio interno de 4–5 px;
- caption e status deixam de parecer cartões flutuantes grandes e passam a funcionar como overlays técnicos de baixa interferência;
- coordenadas usam números tabulares para leitura estável;
- a legenda vira uma faixa técnica integrada à base do workspace;
- tema claro mantém a superfície cartográfica clara;
- a paleta Velox altera apenas o acento visual, sem modificar semântica de rota.

### Fronteira arquitetural

A V10 é CSS/documentação/testes. Não altera HTML, JavaScript, SVG, Leaflet, parser, goTo(), state.index, timeline, scrubber, autoplay, teclado, geometria, checkpoints, terminalClosureState(), buildTimeline() ou a projeção DEP/TRF/TER.

As regras cartográficas da V3 continuam soberanas: histórico processado vermelho sólido, continuação publicada sem ETIM azul tracejado, terminal previsto âmbar tracejado e terminal ativo âmbar sólido.
