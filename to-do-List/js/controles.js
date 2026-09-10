/* ==========================================================================
   controles.js — os ouvintes e a sincronização dos campos (E4)
   ==========================================================================

   Dois sentidos de mão única, e é importante não confundi-los:

     ouvintes   →  campo mexeu, então o ESTADO muda e o ciclo é chamado
     sincronizar →  o estado é a verdade, então os CAMPOS passam a refleti-lo

   Nenhum ouvinte desenha, esconde ou percorre cartões. Cada um faz duas
   linhas de trabalho: escreve no estado e chama `aoMudar()`, que é sempre o
   mesmo ponto de renderização. Por isso não importa a ordem em que a pessoa
   mexe nos controles: o resultado é sempre o desenho do estado inteiro.

   Os ouvintes são instalados UMA vez, na inicialização, em elementos que a
   renderização nunca substitui (o formulário e o <main>). Nada aqui é
   reinstalado a cada ciclo — é isso que impede a ação de um cartão de
   disparar duas, três, dez vezes depois de várias renderizações.
   ========================================================================== */

import { estado, limparCriterios } from './estado.js';

/** Os controles fixos da página. */
function controles() {
  return {
    formulario: document.getElementById('form-busca'),
    busca: document.getElementById('busca'),
    status: document.getElementById('stts'),
    prioridade: document.getElementById('prop'),
    ordenacao: document.getElementById('ordem'),
    limpar: document.getElementById('limpar'),
    quadro: document.querySelector('main'),
  };
}

/**
 * Instala os ouvintes. Chamar apenas uma vez.
 *
 * @param {() => void} aoMudar — o ponto único de renderização (`atualizar`).
 */
export function ligarControles(aoMudar) {
  const c = controles();

  /* Busca ao vivo: `input` dispara a cada caractere, inclusive quando o texto
     é colado ou apagado. `change` só dispararia ao sair do campo, e a busca
     pareceria travada enquanto a pessoa digita. */
  c.busca.addEventListener('input', (evento) => {
    estado.busca = evento.target.value;
    aoMudar();
  });

  /* Nos <select>, `change` é o evento certo: dispara quando a opção passa a
     valer, tanto pelo mouse quanto pelo teclado. */
  c.status.addEventListener('change', (evento) => {
    estado.status = evento.target.value;
    aoMudar();
  });

  c.prioridade.addEventListener('change', (evento) => {
    estado.prioridade = evento.target.value;
    aoMudar();
  });

  c.ordenacao.addEventListener('change', (evento) => {
    estado.ordenacao = evento.target.value;
    aoMudar();
  });

  /* "Limpar filtros" devolve o ESTADO ao ponto de partida — e nada mais.
     Os campos voltam sozinhos, porque `atualizar()` sincroniza os controles
     a partir do estado no mesmo ciclo. Se este ouvinte também limpasse os
     campos à mão, haveria duas fontes de verdade para o mesmo assunto. */
  c.limpar.addEventListener('click', () => {
    limparCriterios();
    aoMudar();
  });

  /* O formulário existe desde a E1 e continua na tela. Impedir o submit é o
     que permite manter o botão "Buscar" e a tecla Enter sem recarregar a
     página — o estado já está atualizado pelo evento `input`, então aqui
     basta redesenhar. */
  c.formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    aoMudar();
  });

  /* DELEGAÇÃO — um único ouvinte no <main>, que nunca é substituído.
     Os cartões, sim, são recriados a cada ciclo. Um ouvinte por cartão
     morreria junto com o nó antigo (e teria de ser reinstalado, com risco de
     acumular ouvintes duplicados). Ouvindo no ancestral, o clique é
     capturado quando sobe pela árvore, seja o cartão o primeiro ou o
     décimo desenho. */
  c.quadro.addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-acao="filtrar-prioridade"]');
    if (!botao) return;

    /* Mais uma vez: a ação de um cartão não mexe na tela. Ela escreve no
       estado e chama o mesmo ciclo dos outros controles — o select de
       prioridade inclusive se ajusta sozinho, por causa disso. */
    estado.prioridade = botao.dataset.prioridade;
    aoMudar();
  });
}

/**
 * Faz os campos refletirem o estado.
 *
 * Chamada em todo ciclo, para que estado e controles nunca discordem.
 *
 * A comparação antes de atribuir não é preciosismo: escrever em `value` um
 * texto igual ao que já está lá pode reposicionar o cursor no fim do campo em
 * alguns navegadores. Quem estivesse editando o meio da palavra veria o
 * cursor pular a cada letra. Atribuindo só quando o valor mudou de verdade, a
 * digitação normal nunca é interrompida.
 *
 * @param {object} estadoAtual — o objeto de estado único.
 */
export function sincronizarControles(estadoAtual) {
  const c = controles();

  if (c.busca.value !== estadoAtual.busca) c.busca.value = estadoAtual.busca;
  if (c.status.value !== estadoAtual.status) c.status.value = estadoAtual.status;
  if (c.prioridade.value !== estadoAtual.prioridade) c.prioridade.value = estadoAtual.prioridade;
  if (c.ordenacao.value !== estadoAtual.ordenacao) c.ordenacao.value = estadoAtual.ordenacao;
}
