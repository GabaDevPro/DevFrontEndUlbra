/* ==========================================================================
   api.js — obter os dados
   ==========================================================================

   Responsabilidade única: buscar o arquivo, conferir se veio bem e devolver
   o array de tarefas.

   NÃO existe uma linha de DOM aqui dentro. Este módulo não sabe que existe
   uma tela. Ele devolve dados ou lança um erro; quem decide o que mostrar é
   `estados.js`.
   ========================================================================== */

/**
 * Erro de protocolo: a rede funcionou, o servidor respondeu — mas respondeu
 * uma falha (404, 500, ...).
 *
 * Existe uma classe própria porque `fetch` NÃO rejeita a promessa quando o
 * servidor responde 404. Para o `fetch`, "recebi uma resposta 404" é sucesso:
 * a viagem até o servidor deu certo. Só falhas de rede rejeitam a promessa.
 * Por isso o 404 precisa ser transformado em erro à mão, com `throw`.
 */
export class ErroHttp extends Error {
  constructor(status, statusText) {
    super(`o servidor respondeu ${status} ${statusText || ''}`.trim());
    this.name = 'ErroHttp';
    this.status = status;
  }
}

/**
 * Busca as tarefas no servidor.
 *
 * @param {string} caminho — caminho relativo do arquivo JSON.
 * @returns {Promise<Array<object>>} o array de tarefas.
 * @throws {TypeError}  falha de rede (offline, servidor fora do ar)
 * @throws {ErroHttp}   falha de protocolo (404, 500, ...)
 * @throws {SyntaxError} falha de formato (JSON inválido ou sem a chave certa)
 */
export async function carregarTarefas(caminho = 'dados.json') {
  /* PRIMEIRA ESPERA — a promessa do fetch resolve assim que chegam o status
     e os cabeçalhos da resposta. O corpo do arquivo ainda NÃO foi baixado. */
  const resposta = await fetch(caminho);

  /* Como o fetch não rejeita em 404, a verificação é nossa.
     `resposta.ok` é true só para status entre 200 e 299.
     Isto é conferido ANTES de ler o corpo: não faz sentido tentar
     interpretar como JSON o corpo de uma página de erro. */
  if (!resposta.ok) {
    throw new ErroHttp(resposta.status, resposta.statusText);
  }

  /* SEGUNDA ESPERA — só aqui o corpo termina de chegar e é convertido de
     texto para objeto JavaScript. São duas esperas porque são duas etapas
     distintas: receber a resposta e receber (e interpretar) o conteúdo dela.
     Se o texto não for um JSON válido, esta linha lança um SyntaxError. */
  const conteudo = await resposta.json();

  /* O JSON pode ser válido e ainda assim não servir: o documento raiz precisa
     ser um objeto com a chave `tarefas` contendo um array. Um SyntaxError aqui
     mantém a coerência — para quem chamou, é o mesmo tipo de problema:
     o arquivo chegou, mas não está no formato combinado. */
  if (conteudo === null || typeof conteudo !== 'object' || !Array.isArray(conteudo.tarefas)) {
    throw new SyntaxError('o documento não tem um array na chave "tarefas"');
  }

  return conteudo.tarefas;
}
