/* ==========================================================================
   renderizacao.js — desenhar tarefas na tela (aula 5)
   ==========================================================================

   Este módulo tem uma responsabilidade só: receber um array de tarefas e
   desenhar os cartões nas colunas.

   O que ele NÃO faz, de propósito:
     - não busca dados (não existe fetch aqui);
     - não decide estados de tela (não sabe o que é "carregando" ou "erro");
     - não guarda o array em lugar nenhum.

   Por isso a E3 trocou a origem dos dados sem alterar este arquivo: para
   `renderizarTarefas`, tanto faz se o array veio de `dados.js`, de um
   `fetch` ou de qualquer outro lugar. Ele só precisa de um array.
   ========================================================================== */

const PRIORIDADES = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
};

/** Converte "2026-08-14" (formato do JSON) em "14/08/2026" (formato de leitura). */
export function formatarData(iso) {
  const partes = String(iso).split('-');
  if (partes.length !== 3) return String(iso);
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

/** Monta o <li><article> de uma tarefa. */
function criarCartao(tarefa) {
  const item = document.createElement('li');

  const cartao = document.createElement('article');
  cartao.className = 'tarefa';
  cartao.dataset.id = tarefa.id;

  const titulo = document.createElement('h3');
  titulo.textContent = tarefa.titulo;
  titulo.title = tarefa.titulo;

  const lista = document.createElement('dl');
  const linhas = [
    ['Projeto', tarefa.projeto, null],
    ['Responsável', tarefa.responsavel, null],
    ['Prazo', formatarData(tarefa.prazo), tarefa.prazo],
    ['Prioridade', PRIORIDADES[tarefa.prioridade] || tarefa.prioridade, null],
  ];

  linhas.forEach(([rotulo, valor, dataIso], indice) => {
    const dt = document.createElement('dt');
    dt.textContent = rotulo;

    const dd = document.createElement('dd');
    if (dataIso) {
      const tempo = document.createElement('time');
      tempo.dateTime = dataIso;
      tempo.textContent = valor;
      dd.appendChild(tempo);
    } else {
      dd.textContent = valor;
    }
    if (indice === 3) dd.className = `prioridade-${tarefa.prioridade}`;

    lista.append(dt, dd);
  });

  cartao.append(titulo, lista);
  item.appendChild(cartao);
  return item;
}

/**
 * Desenha o array de tarefas nas quatro colunas do quadro.
 * Cada tarefa cai na coluna cujo data-status bate com o seu status.
 *
 * @param {Array<object>} tarefas — lista já pronta para ser exibida.
 */
export function renderizarTarefas(tarefas) {
  const colunas = document.querySelectorAll('main section[data-status]');

  colunas.forEach((coluna) => {
    const lista = coluna.querySelector('ul');
    const status = coluna.dataset.status;

    const daColuna = tarefas
      .filter((tarefa) => tarefa.status === status)
      .sort((a, b) => String(a.prazo).localeCompare(String(b.prazo)));

    lista.replaceChildren();
    daColuna.forEach((tarefa) => lista.appendChild(criarCartao(tarefa)));

    coluna.querySelector('.contador').textContent = `(${daColuna.length})`;
  });
}
