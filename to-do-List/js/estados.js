/* ==========================================================================
   estados.js — decidir qual tela está valendo
   ==========================================================================

   A E3 tinha quatro estados. A E4 acrescenta o quinto, e ele é a razão de
   metade dos erros desta etapa:

     carregando     — o pedido saiu, a resposta ainda não voltou
     erro           — alguma coisa falhou no caminho
     vazio          — deu tudo certo, a ORIGEM não tem tarefas
     sem-resultados — a origem tem tarefas, os CRITÉRIOS não encontraram nenhuma
     sucesso        — há tarefas visíveis, o quadro é desenhado

   `vazio` e `sem-resultados` parecem a mesma tela em branco e não são a mesma
   coisa: no primeiro caso não há nada para achar, no segundo há, e a pessoa
   só precisa mudar um critério. Dar a mesma mensagem aos dois faz alguém
   procurar defeito no arquivo de dados quando o "defeito" é um filtro ligado.

   E nenhum dos dois é `erro`: ninguém falhou, então nada disso vem do
   `catch`. `sem-resultados` é decidido pelo tamanho da lista derivada.

   NÃO existe requisição aqui dentro, e não existe filtro: este módulo recebe
   pronto o resultado e escolhe o que a pessoa vê.
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

/** "1 tarefa" / "10 tarefas" — concordância no plural. */
function tarefasNoPlural(quantidade) {
  return quantidade === 1 ? 'tarefa' : 'tarefas';
}

/**
 * Aplica uma das cinco situações à tela.
 *
 * A região de status (role="status", aria-live="polite") recebe um texto
 * diferente em cada uma delas, e no sucesso informa "N de M tarefas": os dois
 * números vêm da mesma lista derivada que gerou os cartões, no mesmo ciclo.
 *
 * Nada aqui chama `focus()`. Atualizar a tela não pode mover o foco do
 * teclado: quem está digitando na busca precisa continuar digitando, e é o
 * `aria-live` que se encarrega de anunciar a mudança sem roubar o cursor.
 *
 * @param {'carregando'|'erro'|'vazio'|'sem-resultados'|'sucesso'} situacao
 * @param {{visiveis?: Array<object>, total?: number, erro?: Error}} [dados]
 */
export function renderizarEstado(situacao, dados = {}) {
  const { quadro, painel, regiao } = elementos();
  const visiveis = dados.visiveis ?? [];
  const total = dados.total ?? 0;

  /* O quadro só aparece no sucesso; nos outros quatro, quem fala é o painel.
     Nenhuma situação deixa a tela em branco: sempre há um dos dois visível. */
  quadro.hidden = situacao !== 'sucesso';
  painel.hidden = situacao === 'sucesso';
  painel.className = `painel-estado painel-${situacao}`;

  /* Só um dos dois tem conteúdo por vez: o que sai de cena fica limpo, para
     não deixar restos da tela anterior escondidos no documento. */
  if (situacao === 'sucesso') painel.replaceChildren();
  else limparQuadro(quadro);

  switch (situacao) {
    case 'carregando':
      escreverNoPainel(
        painel,
        'Carregando tarefas…',
        'Buscando o arquivo de dados no servidor.',
      );
      regiao.textContent = 'Carregando tarefas.';
      break;

    case 'sucesso':
      renderizarTarefas(visiveis);
      regiao.textContent =
        `Mostrando ${visiveis.length} de ${total} ${tarefasNoPlural(total)}.`;
      break;

    case 'sem-resultados':
      escreverNoPainel(
        painel,
        'Nenhuma tarefa para estes critérios',
        'As tarefas foram carregadas, mas nenhuma delas combina com a busca e '
        + 'os filtros atuais. Altere um critério ou use "Limpar filtros" para '
        + 'ver todas de novo.',
      );
      regiao.textContent =
        `Nenhum resultado: 0 de ${total} ${tarefasNoPlural(total)} atendem aos critérios atuais.`;
      break;

    case 'vazio':
      escreverNoPainel(
        painel,
        'Nenhuma tarefa por aqui',
        'O arquivo foi carregado e lido sem nenhum problema — ele só não tem '
        + 'tarefas cadastradas. Não há nada para buscar ou filtrar ainda.',
      );
      regiao.textContent = 'Nenhuma tarefa cadastrada na origem dos dados.';
      break;

    case 'erro':
      escreverNoPainel(
        painel,
        'Não foi possível carregar as tarefas',
        textoDoErro(dados.erro),
      );
      regiao.textContent = 'Erro ao carregar as tarefas.';
      break;
  }
}
