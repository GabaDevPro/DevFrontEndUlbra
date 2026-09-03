/* ==========================================================================
   estados.js — decidir qual das quatro telas está valendo
   ==========================================================================

   A tela tem quatro estados, não um:

     carregando — o pedido saiu, a resposta ainda não voltou
     sucesso    — vieram tarefas, o quadro é desenhado
     vazio      — deu tudo certo, só não há tarefas para mostrar
     erro       — alguma coisa falhou no caminho

   NÃO existe requisição aqui dentro. Este módulo não busca nada: ele recebe
   pronto o resultado (ou o erro) e escolhe o que a pessoa vê.
   ========================================================================== */

import { renderizarTarefas } from './renderizacao.js';

/* Texto de cada tipo de falha. A chave é o `name` do erro, que é justamente
   o que permite diferenciar as três origens de problema. */
const MENSAGENS_DE_ERRO = {
  /* fetch rejeita com TypeError quando nem chegou ao servidor:
     máquina offline, servidor fora do ar, endereço inalcançável. */
  TypeError:
    'Falha de rede: o navegador não conseguiu chegar até o servidor. '
    + 'Verifique sua conexão e se a página está sendo servida por HTTP local.',

  /* Chegou ao servidor, e o servidor recusou: arquivo inexistente, sem permissão... */
  ErroHttp:
    'Falha de protocolo: a página falou com o servidor, mas o arquivo não veio. '
    + 'O caminho pode estar errado ou o arquivo não existe.',

  /* O arquivo chegou inteiro, mas o conteúdo não é um JSON válido. */
  SyntaxError:
    'Falha de formato: o arquivo chegou, mas não está num JSON válido. '
    + 'Uma vírgula sobrando ou uma aspa faltando já é o bastante.',
};

/** Elementos fixos da página, buscados sob demanda. */
function elementos() {
  return {
    quadro: document.querySelector('main'),
    painel: document.getElementById('painel-estado'),
    regiao: document.getElementById('regiao-status'),
  };
}

/* Esvazia as colunas do quadro.
   Esconder o quadro não basta: os cartões da carga anterior continuariam no
   documento, invisíveis mas presentes — encontráveis por script e por leitor
   de tela. Cada estado precisa deixar a página coerente com o que ela afirma. */
function limparQuadro(quadro) {
  quadro.querySelectorAll('section[data-status]').forEach((coluna) => {
    coluna.querySelector('ul').replaceChildren();
    coluna.querySelector('.contador').textContent = '(0)';
  });
}

/** Escreve título e explicação no painel — sempre por textContent, nunca innerHTML. */
function escreverNoPainel(painel, titulo, detalhe) {
  painel.replaceChildren();

  const h2 = document.createElement('h2');
  h2.textContent = titulo;

  const p = document.createElement('p');
  p.textContent = detalhe;

  painel.append(h2, p);
}

/** Monta o texto de erro combinando o tipo da falha com o detalhe técnico. */
function textoDoErro(erro) {
  const base = MENSAGENS_DE_ERRO[erro?.name]
    || 'Falha inesperada ao carregar as tarefas.';
  return erro?.message ? `${base} (detalhe: ${erro.message})` : base;
}

/**
 * Aplica um dos quatro estados à tela.
 *
 * @param {'carregando'|'sucesso'|'vazio'|'erro'} estado
 * @param {Array<object>|Error} [dados] — o array, no sucesso; o erro, na falha.
 */
export function renderizarEstado(estado, dados) {
  const { quadro, painel, regiao } = elementos();

  /* O quadro só aparece no sucesso; nos outros três, quem fala é o painel.
     Nenhum estado deixa a tela em branco: sempre há um dos dois visível. */
  quadro.hidden = estado !== 'sucesso';
  painel.hidden = estado === 'sucesso';
  painel.className = `painel-estado painel-${estado}`;

  /* Só um dos dois tem conteúdo por vez: o que sai de cena fica limpo, para
     não deixar restos da tela anterior escondidos no documento. */
  if (estado === 'sucesso') painel.replaceChildren();
  else limparQuadro(quadro);

  switch (estado) {
    case 'carregando':
      escreverNoPainel(
        painel,
        'Carregando tarefas…',
        'Buscando o arquivo de dados no servidor.',
      );
      regiao.textContent = 'Carregando tarefas.';
      break;

    case 'sucesso': {
      const tarefas = dados;
      renderizarTarefas(tarefas);
      regiao.textContent = tarefas.length === 1
        ? '1 tarefa carregada.'
        : `${tarefas.length} tarefas carregadas.`;
      break;
    }

    case 'vazio':
      escreverNoPainel(
        painel,
        'Nenhuma tarefa por aqui',
        'O arquivo foi carregado e lido sem nenhum problema — ele só não tem '
        + 'tarefas cadastradas. Use "+ Nova tarefa" para começar.',
      );
      regiao.textContent = 'Nenhuma tarefa cadastrada.';
      break;

    case 'erro':
      escreverNoPainel(
        painel,
        'Não foi possível carregar as tarefas',
        textoDoErro(dados),
      );
      regiao.textContent = 'Erro ao carregar as tarefas.';
      break;
  }
}
