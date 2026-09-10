/* ==========================================================================
   derivar.js — do estado para a lista visível (E4)
   ==========================================================================

   Uma função de derivação: entra o estado, sai a lista que deve aparecer.

   Três coisas que este módulo NÃO faz, e é por elas que ele existe:

     1. não consulta o DOM — não sabe que existem campos, selects ou cartões;
     2. não altera o objeto de estado nem o array `estado.tarefas`;
     3. não guarda nada entre chamadas — mesma entrada, mesma saída, sempre.

   Por (3), o teste dos critérios combinados passa de graça: o resultado
   depende só dos valores atuais do estado, e não da ordem em que a pessoa
   mexeu nos controles. Não existe "filtrar o resultado anterior": cada ciclo
   parte de novo da lista original.

   Este arquivo não importa nada. É a parte da aplicação que se pode testar
   sem navegador, porque é só transformação de dados.
   ========================================================================== */

/** Comparadores de ordenação. A chave é o valor do <select> de ordenação. */
const COMPARADORES = {
  /* Prazos vêm em ISO ("2026-08-14"), formato em que a ordem alfabética é a
     ordem cronológica — ano, mês e dia sempre com o mesmo número de dígitos.
     Por isso comparar texto basta, e não é preciso criar objetos Date. */
  'prazo-asc': (a, b) => comparar(a, b),
  'prazo-desc': (a, b) => comparar(b, a),
};

/* Empate de prazo é desempatado pelo título, para que o mesmo conjunto de
   critérios produza sempre exatamente a mesma sequência de cartões. */
function comparar(a, b) {
  const prazos = String(a.prazo).localeCompare(String(b.prazo));
  if (prazos !== 0) return prazos;
  return String(a.titulo).localeCompare(String(b.titulo), 'pt-BR');
}

/**
 * Ordena SEM alterar a lista recebida.
 *
 * `sort()` reordena o próprio array em que é chamado. Chamá-lo sobre
 * `estado.tarefas` embaralharia a fonte canônica de forma permanente: a
 * ordem original nunca voltaria, nem depois de "Limpar filtros". O espalhamento
 * `[...lista]` cria um array novo, e é esse novo que é ordenado.
 *
 * @param {Array<object>} lista
 * @param {string} ordenacao
 * @returns {Array<object>} um array novo, ordenado.
 */
function ordenar(lista, ordenacao) {
  const comparador = COMPARADORES[ordenacao];
  if (!comparador) return [...lista];
  return [...lista].sort(comparador);
}

/** Um texto contém o termo? Comparação em minúsculas, dos dois lados. */
function contem(texto, termo) {
  return String(texto).toLowerCase().includes(termo);
}

/**
 * A lista visível: busca, filtros e ordenação combinados.
 *
 * Os três critérios são aplicados juntos, na mesma passagem, e cada um sabe
 * qual é o seu valor "neutro": termo vazio, '' em status e '' em prioridade.
 * Um critério neutro simplesmente não opina — é isso que faz cada filtro
 * funcionar sozinho e todos funcionarem combinados.
 *
 * @param {object} estado — o objeto de estado único.
 * @returns {Array<object>} lista nova, pronta para ser desenhada.
 */
export function derivarVisiveis(estado) {
  const termo = estado.busca.trim().toLowerCase();

  /* `filter` devolve um array novo; o original fica intacto. */
  const filtradas = estado.tarefas.filter((tarefa) => {
    const casaBusca = termo === '' || contem(tarefa.titulo, termo);
    const casaStatus = estado.status === '' || tarefa.status === estado.status;
    const casaPrioridade = estado.prioridade === '' || tarefa.prioridade === estado.prioridade;
    return casaBusca && casaStatus && casaPrioridade;
  });

  return ordenar(filtradas, estado.ordenacao);
}
