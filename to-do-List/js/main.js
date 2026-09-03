/* ==========================================================================
   main.js — a inicialização, e só ela
   ==========================================================================

   Junta as peças: pede os dados a `api.js` e manda `estados.js` desenhar o
   que for o caso. É o único arquivo que conhece os dois lados.
   ========================================================================== */

import { carregarTarefas } from './api.js';
import { renderizarEstado } from './estados.js';

/* Troque esta constante para reproduzir os testes do enunciado:

     'dados.json'                    sucesso
     'testes/vazio.json'             estado vazio  ({"tarefas": []})
     'testes/formato-invalido.json'  erro de formato (SyntaxError)
     'testes/nao-existe.json'        erro de protocolo (404 / ErroHttp)

   Para o erro de rede não é preciso trocar nada: basta pôr o DevTools em
   Network > Offline e recarregar.                                          */
const CAMINHO_DOS_DADOS = 'dados.json';

async function iniciar() {
  /* O estado de carregando é aplicado ANTES do await.
     Se viesse depois, a tela ficaria em branco durante toda a espera —
     justamente o momento em que a pessoa mais precisa de um sinal. */
  renderizarEstado('carregando');

  try {
    const tarefas = await carregarTarefas(CAMINHO_DOS_DADOS);

    /* Vazio NÃO é erro, e por isso não mora no catch: a requisição funcionou,
       o JSON era válido, o array simplesmente veio sem itens. Tratar isso
       como falha mentiria para quem está usando. */
    if (tarefas.length === 0) {
      renderizarEstado('vazio');
    } else {
      renderizarEstado('sucesso', tarefas);
    }
  } catch (erro) {
    /* O console ajuda quem está desenvolvendo, mas não é a tela do usuário:
       a mensagem também precisa aparecer na página. */
    console.error('Falha ao carregar as tarefas:', erro);
    renderizarEstado('erro', erro);
  }
}

/* Sem await de nível superior: a espera acontece dentro de `iniciar`.
   Aqui a função apenas é chamada, e o módulo termina de executar na hora. */
iniciar();
