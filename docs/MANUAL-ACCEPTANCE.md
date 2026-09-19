# Aceitação Manual — FlightFlow Evolução V11 / main

Este roteiro valida em navegador real a linha visual **V1–V11** e os contratos operacionais preservados no `main`.

> **Status atual:** automação certificada. Aceitação humana ainda **pendente**.
>
> Último SHA funcional V11 certificado: `a27ffee33577d88536a3828f9f3cca97b47fc898`.
>
> Pós-merge workflow #59: **675/675 Node + 79/79 Playwright**, sem contadores críticos.

## 1. Preparação

Antes do teste:

- [ ] usar a branch **main** de `ricksir/flightflow-evolucao`;
- [ ] não usar o ZIP/tag `v0.2.0` para avaliar a V11;
- [ ] executar preferencialmente com `npm start`;
- [ ] abrir `http://127.0.0.1:4173`;
- [ ] usar **Ctrl+F5** se houver risco de cache;
- [ ] registrar navegador, resolução e histórico usado.

A linha de desenvolvimento continua identificada como **0.2.1-dev** até decisão de release.

## 2. Matriz visual obrigatória

Executar a validação nas seguintes larguras:

### 1600×900

- [ ] Mission Rail visível, escuro e compacto;
- [ ] Command Bar escura e legível;
- [ ] mapa claramente dominante;
- [ ] Quadro Operacional alinhado ao mapa;
- [ ] Flight Situation Strip em uma faixa linear acima da carta;
- [ ] Temporal Deck escuro e legível;
- [ ] caption/status da carta não encobrem informação essencial.

### 1100×820

- [ ] Quadro Operacional reduz para a largura intermediária esperada;
- [ ] mapa permanece maior que o quadro;
- [ ] Flight Situation Strip quebra o bloco de estado para segunda linha sem ocultar informação;
- [ ] controles continuam operáveis e sem sobreposição.

### Abaixo de 900 px

- [ ] layout passa para fluxo vertical;
- [ ] Mission Rail desktop não compromete a navegação;
- [ ] mapa e inspector ocupam a largura disponível;
- [ ] timeline e controles permanecem acessíveis.

## 3. Temas e aparência

Validar em **claro**, **escuro** e **Dashboard moderno/Velox**:

- [ ] a estrutura permanece a mesma;
- [ ] tema claro mantém a superfície cartográfica clara;
- [ ] Mission Rail, Command Bar e Temporal Deck mantêm contraste;
- [ ] Velox altera chrome/acento sem substituir semântica ATS;
- [ ] foco de teclado permanece visível;
- [ ] não existe texto ilegível por contraste ou grade de cores.

## 4. Fluxo operacional básico

Com histórico representativo:

- [ ] carregar o arquivo sem erro fatal;
- [ ] DEP permanece a referência temporal;
- [ ] Próximo avança exatamente um estado esperado;
- [ ] Anterior restaura o estado anterior;
- [ ] clicar na timeline converge para o mesmo estado;
- [ ] scrubber converge para o mesmo estado;
- [ ] setas/teclado convergem para o mesmo estado;
- [ ] autoplay percorre a mesma sequência;
- [ ] a aeronave aparece sobre os checkpoints correspondentes;
- [ ] trocar de histórico limpa rota/eventos derivados da sessão anterior.

## 5. Sequência crítica protegida

Confirmar:

- [ ] `PADIL → IRISO → LIBEC → EGDOD → IBGAM → PMS → ILVES → MASVA`;
- [ ] `ILVES 01:34` antes de `MASVA 01:36`;
- [ ] nenhum fixo é pulado;
- [ ] retrocesso percorre a sequência inversa;
- [ ] timeline, scrubber, teclado e autoplay permanecem equivalentes.

## 6. TAM3774

Rota protegida:

`SBBR → UMSUB → KUKOL → SIRUL → VUDOT → EDMIN → 1853S04832W → UDIGI → MEVIK → ASTOB → VUPOG → UPONA → 2127S04856W → ISISA → ENPEG → PALCA → ANSOK → IMTBI`

Continuação publicada sem ETIM:

`VULRU → UBNID → GIKLU → USVIG → UMGUL`

Fechamento terminal:

`UMGUL → SBCT`

Validar:

- [ ] antes de TER, o fechamento terminal aparece apenas como preview quando aplicável;
- [ ] antes de TER, a aeronave não é deslocada prematuramente para SBCT;
- [ ] no TER, o fechamento pode ficar ativo e terminar no ADES;
- [ ] não aparece ETIM, CFL, STAR, fixo ou horário fabricado;
- [ ] retroceder do TER restaura exatamente o estado anterior;
- [ ] avançar novamente ao TER reproduz a mesma geometria;
- [ ] a linha final até o destino permanece visível conforme a semântica ativa.

## 7. Ferramentas e painéis

- [ ] Rota Processada abre sem cobrir indevidamente a rota;
- [ ] legenda da Rota Processada permanece utilizável;
- [ ] STRIP abre, atualiza, minimiza e restaura;
- [ ] FPV abre, atualiza, minimiza e restaura;
- [ ] Quadro Operacional mostra dados sem truncamento crítico;
- [ ] controles de mapa continuam funcionais;
- [ ] Configurações e aparência continuam abrindo normalmente.

## 8. Critério de aprovação

A aceitação manual só pode ser marcada como concluída quando:

- [ ] todas as verificações críticas acima forem executadas;
- [ ] não existir regressão crítica conhecida;
- [ ] qualquer divergência encontrada tiver evidência e decisão registrada;
- [ ] o SHA efetivamente testado estiver identificado.

**Resultado da aceitação:** [ ] APROVADO  [ ] REPROVADO  [ ] APROVADO COM RESSALVAS

SHA testado: ______________________________

Navegador/versão: _________________________

Resoluções verificadas: ___________________

Histórico(s) usado(s): ____________________

Observações: ______________________________

## 9. Como registrar um problema

Registrar:

1. histórico/arquivo usado;
2. evento atual e anterior;
3. ação que provocou o problema;
4. screenshot da tela inteira;
5. vídeo curto, se possível;
6. tema ativo;
7. navegador e resolução;
8. comportamento esperado e observado.

Não corrigir um problema observado alterando o baseline temporal/espacial sem primeiro reproduzi-lo e criar um contrato específico.
