/* ==========================================================================
   renderizacao.js — desenhar tarefas na tela
   ==========================================================================

   Este módulo tem uma responsabilidade só: receber um array de tarefas e
   desenhar os cartões nas colunas.

   O que ele NÃO faz, de propósito:
     - não busca dados (não existe fetch aqui);
     - não decide estados de tela (não sabe o que é "carregando" ou "erro");
     - não conhece o objeto de estado, nem busca, nem filtros;
     - não guarda o array em lugar nenhum.

   Por isso a E3 trocou a origem dos dados sem alterar este arquivo, e a E4
   pôde ligar busca e filtros sem reescrevê-lo: `renderizarTarefas` continua
   recebendo um array e desenhando exatamente o que recebeu.

   O que mudou na E4: a ordenação saiu daqui. Antes, cada coluna reordenava
   por prazo por conta própria; agora a ordem é decidida uma vez, na
   derivação, e este módulo a PRESERVA. Se ele continuasse reordenando, o
   critério escolhido pela pessoa seria descartado no último instante — a tela
   deixaria de ser uma projeção fiel do estado.
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

/* Botão de ação do cartão.
   Ele não recebe ouvinte aqui: quem escuta é um único ouvinte delegado no
   <main>, instalado uma vez em `controles.js`. Este botão só carrega, no
   `data-`, a informação de que a ação precisa. Assim um cartão recém-criado
   já funciona sem que nada precise ser religado depois de cada desenho. */
function criarAcao(tarefa) {
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'acao-cartao';
  botao.dataset.acao = 'filtrar-prioridade';
  botao.dataset.prioridade = tarefa.prioridade;
  botao.textContent = `Ver só prioridade ${(PRIORIDADES[tarefa.prioridade] || tarefa.prioridade).toLowerCase()}`;
  return botao;
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

  cartao.append(titulo, lista, criarAcao(tarefa));
  item.appendChild(cartao);
  return item;
}

/**
 * Desenha o array de tarefas nas quatro colunas do quadro.
 * Cada tarefa cai na coluna cujo data-status bate com o seu status, na mesma
 * ordem em que veio no array.
 *
 * `replaceChildren()` troca o conteúdo da coluna de uma vez: o desenho
 * anterior sai inteiro antes do novo entrar. É o que garante que dez
 * mudanças de filtro não empilhem dez versões dos mesmos cartões.
 *
 * A contagem de cada coluna sai da mesma lista que gerou os cartões — não de
 * uma contagem à parte, nem de `querySelectorAll` no DOM. Contar de novo, de
 * outra fonte, é como as duas metades da tela começam a discordar.
 *
 * @param {Array<object>} tarefas — lista já filtrada e ordenada.
 */
export function renderizarTarefas(tarefas) {
  const colunas = document.querySelectorAll('main section[data-status]');

  colunas.forEach((coluna) => {
    const lista = coluna.querySelector('ul');
    const status = coluna.dataset.status;

    const daColuna = tarefas.filter((tarefa) => tarefa.status === status);

    lista.replaceChildren();
    daColuna.forEach((tarefa) => lista.appendChild(criarCartao(tarefa)));

    coluna.querySelector('.contador').textContent = `(${daColuna.length})`;
  });
}
