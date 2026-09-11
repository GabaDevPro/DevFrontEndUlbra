/* ==========================================================================
   estado.js — o objeto de estado único (E4)
   ==========================================================================

   A regra desta entrega: **o estado é a fonte; a tela é uma projeção**.

   Existe um, e só um, lugar onde mora a verdade da aplicação. Nada é lido de
   volta da tela: ninguém pergunta ao DOM quais tarefas existem, qual filtro
   está ativo ou quantos cartões há. Todo evento altera este objeto e manda
   redesenhar; a tela é sempre o desenho deste objeto num instante.

   As sete chaves pedidas pelo enunciado:

     tarefas      — o array ORIGINAL, exatamente como veio de carregarTarefas()
     busca        — o texto digitado no campo de busca
     status       — o filtro por status      ('' = Todos)
     prioridade   — o filtro por prioridade  ('' = Todas)
     ordenacao    — o critério de ordenação  ('prazo-asc' | 'prazo-desc')
     carregamento — a situação da obtenção   ('inicial' | 'carregando' | 'pronto')
     erro         — o erro atual, ou null quando não há erro

   O que este objeto NÃO tem, de propósito: uma segunda lista já filtrada.
   Guardar `tarefasVisiveis` aqui criaria duas fontes de verdade que podem
   discordar. A lista visível é DERIVADA a cada ciclo, em `derivar.js`, e vive
   apenas dentro do ciclo que a usou.
   ========================================================================== */

/* Os valores iniciais dos quatro critérios, num objeto separado e congelado.
   Ter isto escrito num único lugar é o que faz "Limpar filtros" ser honesto:
   o botão não inventa valores nem mexe na tela, ele apenas devolve o estado
   a este ponto de partida. `Object.freeze` impede que um descuido mais tarde
   sobrescreva a referência do "zero" da aplicação. */
export const CRITERIOS_INICIAIS = Object.freeze({
  busca: '',
  status: '',
  prioridade: '',
  ordenacao: 'prazo-asc',
});

/* O vocabulário de cada critério: exatamente os `value` dos <option> do HTML.
   Até aqui a aplicação não precisava desta lista, porque o único jeito de
   escrever nos critérios era pelos próprios controles — e um <select> não
   consegue produzir um valor que ele não oferece.

   O desafio opcional abre uma segunda porta de entrada: a barra de endereço,
   onde qualquer pessoa pode digitar `?prioridade=urgente`. Sem conferência,
   esse valor entraria no estado, o quadro ficaria vazio e o <select> mostraria
   "Todas" — porque atribuir a `value` um texto sem <option> correspondente faz
   o navegador cair silenciosamente para a primeira opção. Estado e controle
   passariam a contar histórias diferentes, que é justamente o que esta entrega
   existe para impedir.

   `busca` não aparece aqui: texto livre não tem vocabulário a conferir.

   Esta lista e os <option> do `index.html` precisam concordar. São dois
   lugares porque são duas linguagens; ao acrescentar um status novo, mexa nos
   dois. */
export const VALORES_VALIDOS = Object.freeze({
  status: Object.freeze(['fazer', 'andamento', 'revisao', 'concluida']),
  prioridade: Object.freeze(['baixa', 'media', 'alta']),
  ordenacao: Object.freeze(['prazo-asc', 'prazo-desc']),
});

/** O estado único da aplicação. */
export const estado = {
  /* Fonte canônica. Depois de carregada, esta lista não é reordenada nem
     filtrada por ninguém — quem precisa de outra ordem faz uma cópia. */
  tarefas: [],

  /* Os quatro critérios da interface, começando nos valores iniciais. */
  ...CRITERIOS_INICIAIS,

  /* Situação da obtenção dos dados. Separada do erro porque são perguntas
     diferentes: "já terminou?" e "deu problema?". */
  carregamento: 'inicial',
  erro: null,
};

/**
 * Devolve os critérios aos valores iniciais.
 *
 * Repare no que esta função NÃO faz: não toca em campos, não limpa cartões,
 * não escreve mensagem. Ela só mexe no estado. Quem redesenha a tela e
 * sincroniza os controles é o ciclo único de atualização, em `main.js`.
 */
export function limparCriterios() {
  Object.assign(estado, CRITERIOS_INICIAIS);
}
