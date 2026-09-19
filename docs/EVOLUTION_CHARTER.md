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
