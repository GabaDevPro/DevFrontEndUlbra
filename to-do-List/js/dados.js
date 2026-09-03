/* ==========================================================================
   dados.js — origem dos dados até a E2
   ==========================================================================

   ARQUIVO APOSENTADO NA E3.

   Até a entrega anterior, o quadro era desenhado a partir deste array escrito
   à mão dentro do próprio JavaScript. Na E3 a origem passou a ser o arquivo
   `dados.json`, baixado pela rede em `js/api.js`.

   O arquivo continua aqui só como registro do que existia antes.
   Nenhum módulo em execução o importa — confira com uma busca por
   "dados.js" no projeto: só aparece neste comentário.

   Repare que os objetos abaixo têm exatamente o mesmo formato dos objetos
   dentro de `dados.json`. É por isso que `renderizacao.js` não precisou mudar
   uma linha sequer: quem desenha recebe um array de tarefas e não pergunta de
   onde ele veio.
   ========================================================================== */

export const TAREFAS = [
  { id: 't1', titulo: 'Atividade da Marianne', projeto: 'Página .html', responsavel: 'Marianne Dutra', prazo: '2026-08-14', prioridade: 'media', status: 'fazer' },
  { id: 't2', titulo: 'Modelar banco de dados', projeto: 'Sistema de Biblioteca', responsavel: 'Marianne Dutra', prazo: '2026-08-20', prioridade: 'alta', status: 'fazer' },
  { id: 't3', titulo: 'Estruturar formulário de cadastro', projeto: 'Página .html', responsavel: 'Gabriel Ferreira', prazo: '2026-08-18', prioridade: 'alta', status: 'andamento' },
  { id: 't4', titulo: 'Escrever consultas SQL de empréstimo', projeto: 'Sistema de Biblioteca', responsavel: 'Lucas Andrade', prazo: '2026-08-25', prioridade: 'media', status: 'andamento' },
  { id: 't5', titulo: 'Levantar requisitos com o cliente', projeto: 'Sistema de Biblioteca', responsavel: 'Marianne Dutra', prazo: '2026-08-21', prioridade: 'baixa', status: 'andamento' },
  { id: 't6', titulo: 'Revisar semântica do HTML', projeto: 'Página .html', responsavel: 'Lucas Andrade', prazo: '2026-08-12', prioridade: 'alta', status: 'revisao' },
  { id: 't7', titulo: 'Definir escopo do projeto', projeto: 'Sistema de Biblioteca', responsavel: 'Marianne Dutra', prazo: '2026-07-28', prioridade: 'alta', status: 'concluida' },
  { id: 't8', titulo: 'Criar repositório no GitHub', projeto: 'Página .html', responsavel: 'Lucas Andrade', prazo: '2026-08-01', prioridade: 'baixa', status: 'concluida' },
  { id: 't9', titulo: 'Desenhar wireframe do quadro', projeto: 'Página .html', responsavel: 'Marianne Dutra', prazo: '2026-08-05', prioridade: 'media', status: 'concluida' },
];
