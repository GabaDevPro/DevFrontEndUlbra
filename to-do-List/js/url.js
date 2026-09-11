/* ==========================================================================
   url.js — os critérios na barra de endereço (desafio opcional da E4)
   ==========================================================================

   O que este módulo entrega: um endereço que pode ser copiado, mandado para
   outra pessoa ou guardado nos favoritos, e que reabre o quadro exatamente na
   mesma visão — mesma busca, mesmos filtros, mesma ordenação.

   O RISCO DESTE DESAFIO, e como ele é contornado aqui.

   Até agora a aplicação tinha uma entrada só: os controles. O enunciado avisa
   que a URL acrescenta uma segunda, e onde há duas entradas há a tentação de
   criar duas verdades — o estado dizendo uma coisa e o endereço dizendo outra.

   A saída é não tratar a URL como fonte. Ela é lida UMA vez, na inicialização,
   e daquele instante em diante é apenas mais uma PROJEÇÃO do estado, escrita
   no mesmo ciclo único que desenha os cartões e sincroniza os campos. O papel
   dela é idêntico ao de um <select>: mostra o que o estado diz, nunca decide.

     leitura   URL  ->  estado    uma vez só, antes do primeiro desenho
     escrita   estado  ->  URL    todo ciclo, junto com controles e cartões

   Por isso não existe ouvinte de `popstate` aqui. Como a escrita usa
   `replaceState`, filtrar não empilha entradas no histórico, e o botão Voltar
   continua significando "sair desta página" — que é o que a pessoa espera. As
   outras formas de chegar a um endereço (colar na barra, abrir um favorito,
   clicar num link) recarregam o documento, e aí a leitura da inicialização já
   dá conta. Um ouvinte de `popstate` seria código que nunca dispara.

   Este módulo não conhece cartões, colunas nem campos: ele traduz critérios
   de e para texto de consulta, e nada mais.
   ========================================================================== */

import { CRITERIOS_INICIAIS, VALORES_VALIDOS } from './estado.js';

/* Só os quatro critérios viajam na URL. `tarefas`, `carregamento` e `erro`
   ficam de fora de propósito: os três descrevem a situação de UMA visita
   (o que o servidor devolveu agora), e não a visão que se quer reproduzir.
   Um endereço que carregasse "erro" mandaria a outra pessoa uma falha. */
const CRITERIOS_NA_URL = Object.keys(CRITERIOS_INICIAIS);

/* O valor cabe no critério?
   `busca` é texto livre e aceita qualquer coisa — ela só alimenta um
   `includes`, nunca é interpretada como HTML nem como seletor. Os outros três
   são vocabulário fechado, conferido contra a lista de `estado.js`. */
function valorAceito(chave, valor) {
  const permitidos = VALORES_VALIDOS[chave];
  return permitidos ? permitidos.includes(valor) : true;
}

/**
 * Lê os critérios do texto de consulta.
 *
 * Um parâmetro ausente, escrito errado ou com valor inválido simplesmente não
 * entra no objeto devolvido — em vez de virar erro ou tela em branco. Quem
 * chamar aplica o resultado por cima dos valores iniciais, então o que a URL
 * não disse, ou disse mal, continua no padrão. Endereço quebrado abre o
 * quadro inteiro, que é o comportamento menos surpreendente.
 *
 * @param {string} [consulta] — o `location.search`, com a `?` inclusive.
 * @returns {object} só os critérios presentes e válidos.
 */
export function criteriosDaURL(consulta = window.location.search) {
  const parametros = new URLSearchParams(consulta);
  const criterios = {};

  CRITERIOS_NA_URL.forEach((chave) => {
    if (!parametros.has(chave)) return;

    const valor = parametros.get(chave);
    if (valorAceito(chave, valor)) criterios[chave] = valor;
  });

  return criterios;
}

/**
 * Faz o endereço refletir o estado.
 *
 * Irmã de `sincronizarControles`, e chamada no mesmo ponto do ciclo: as duas
 * recebem o estado e o copiam para fora, nenhuma das duas decide nada.
 *
 * Critério que está no valor inicial não vai para a URL. Assim o quadro sem
 * filtro nenhum tem endereço limpo, e "Limpar filtros" também apaga a consulta
 * da barra — o endereço acompanha o botão, em vez de guardar sujeira de um
 * filtro que já saiu de cena.
 *
 * @param {object} estadoAtual — o objeto de estado único.
 */
export function sincronizarURL(estadoAtual) {
  const parametros = new URLSearchParams();

  CRITERIOS_NA_URL.forEach((chave) => {
    if (estadoAtual[chave] !== CRITERIOS_INICIAIS[chave]) {
      parametros.set(chave, estadoAtual[chave]);
    }
  });

  const texto = parametros.toString();
  const consulta = texto ? `?${texto}` : '';

  /* Nada mudou desde o ciclo anterior: não há o que reescrever. Sem esta
     saída, cada tecla digitada na busca mandaria uma entrada ao histórico
     mesmo quando o endereço já estivesse correto. */
  if (consulta === window.location.search) return;

  try {
    /* `replaceState` e não `pushState`: `pushState` criaria uma entrada de
       histórico por caractere digitado, e sair da página exigiria apertar
       Voltar trinta vezes. A visão atual substitui a anterior.

       O try/catch cobre dois casos reais. Abrir o arquivo por `file://`
       faz alguns navegadores recusarem a troca de endereço — e uma exceção
       aqui derrubaria o ciclo antes de a tela conseguir explicar que a página
       precisa de um servidor HTTP. E há navegadores que limitam quantas vezes
       o histórico pode ser reescrito num intervalo curto; se uma tecla for
       recusada, nada se perde, porque o ciclo seguinte reescreve o endereço
       inteiro a partir do estado, e não um pedaço a mais. */
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${consulta}${window.location.hash}`,
    );
  } catch {
    /* Silêncio proposital: o endereço é conveniência, a aplicação continua
       inteira sem ele. */
  }
}
