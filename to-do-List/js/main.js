/* ==========================================================================
   main.js — a inicialização e o ciclo único de atualização
   ==========================================================================

   Junta as peças. É o único arquivo que conhece todos os lados:

     api.js          obtém os dados            (não sabe que existe tela)
     estado.js       guarda a verdade          (não sabe que existe tela)
     derivar.js      transforma dados          (não sabe que existe tela)
     controles.js    escuta a pessoa           (escreve no estado, não desenha)
     estados.js      escolhe a tela            (não sabe filtrar nem buscar)
     renderizacao.js desenha os cartões        (não sabe de onde vem o array)

   O CICLO ÚNICO é a função `atualizar()`, aqui embaixo. Todo evento —
   digitar, filtrar, ordenar, limpar, clicar num cartão — termina nela. É por
   isso que cartões, contagem, mensagens e controles não conseguem discordar:
   os quatro são escritos na mesma passagem, a partir da mesma leitura do
   estado e da mesma lista derivada.
   ========================================================================== */

import { carregarTarefas } from './api.js';
import { estado } from './estado.js';
import { derivarVisiveis } from './derivar.js';
import { ligarControles, sincronizarControles } from './controles.js';
import { renderizarEstado } from './estados.js';

/* Troque esta constante para reproduzir os testes do enunciado:

     'dados.json'                    sucesso
     'testes/vazio.json'             origem vazia  ({"tarefas": []})
     'testes/formato-invalido.json'  erro de formato (SyntaxError)
     'testes/nao-existe.json'        erro de protocolo (404 / ErroHttp)

   Para o erro de rede não é preciso trocar nada: basta pôr o DevTools em
   Network > Offline e recarregar.                                          */
const CAMINHO_DOS_DADOS = 'dados.json';

/* --------------------------------------------------------------------------
   Qual das cinco telas o estado atual descreve
   --------------------------------------------------------------------------
   A situação da tela também é derivada: não existe uma variável guardando
   "estou mostrando o painel de erro". A ordem das perguntas importa —
   carregar vem antes de falhar, falhar vem antes de contar tarefas.        */
function situacaoDaTela(visiveis) {
  if (estado.carregamento === 'carregando') return 'carregando';
  if (estado.erro) return 'erro';
  if (estado.tarefas.length === 0) return 'vazio';
  if (visiveis.length === 0) return 'sem-resultados';
  return 'sucesso';
}

/* --------------------------------------------------------------------------
   Preservação do foco entre dois desenhos
   --------------------------------------------------------------------------
   Os campos de busca e filtro ficam no <header> e nunca são recriados: quem
   digita ou usa o teclado neles não é interrompido por nada.

   Os botões dentro dos cartões, esses sim, desaparecem e voltam a cada
   desenho. Se o foco estava num deles, o navegador o devolveria ao <body> —
   e a próxima tecla Tab recomeçaria do início da página. Guardar a
   identidade do botão antes e devolver o foco ao equivalente depois não é
   mover o foco: é impedir que a renderização o mova.                       */
function guardarFoco() {
  const ativo = document.activeElement;
  const cartao = ativo?.closest?.('[data-id]');
  if (!cartao || !ativo.dataset.acao) return null;
  return { id: cartao.dataset.id, acao: ativo.dataset.acao };
}

function devolverFoco(marca) {
  if (!marca) return;
  /* Se o cartão saiu da lista visível, não há a quem devolver — e inventar
     outro destino seria justamente mover o foco para onde ninguém pediu. */
  const alvo = document.querySelector(
    `main [data-id="${marca.id}"] [data-acao="${marca.acao}"]`,
  );
  alvo?.focus({ preventScroll: true });
}

/* --------------------------------------------------------------------------
   O ponto único de renderização
   -------------------------------------------------------------------------- */
export function atualizar() {
  const marca = guardarFoco();

  /* A lista visível é derivada UMA vez por ciclo, e essa mesma lista
     alimenta os cartões, as contagens das colunas e a região de status.
     Derivar duas vezes (uma para desenhar, outra para contar) é abrir a
     porta para a tela mostrar 3 cartões e escrever "4 de 10". */
  const visiveis = derivarVisiveis(estado);

  renderizarEstado(situacaoDaTela(visiveis), {
    visiveis,
    total: estado.tarefas.length,
    erro: estado.erro,
  });

  /* Os controles também são projeção do estado, e são sincronizados aqui —
     não dentro dos ouvintes. É o que faz "Limpar filtros" devolver campos e
     cartões ao ponto de partida com um único `Object.assign` no estado. */
  sincronizarControles(estado);

  devolverFoco(marca);
}

/* --------------------------------------------------------------------------
   Inicialização
   -------------------------------------------------------------------------- */
async function iniciar() {
  /* Os ouvintes são instalados uma única vez, antes de qualquer dado chegar.
     Os controles já existem no HTML, e nenhum deles é recriado depois. */
  ligarControles(atualizar);

  /* O estado de carregando é aplicado ANTES do await.
     Se viesse depois, a tela ficaria em branco durante toda a espera —
     justamente o momento em que a pessoa mais precisa de um sinal. */
  estado.carregamento = 'carregando';
  atualizar();

  try {
    const tarefas = await carregarTarefas(CAMINHO_DOS_DADOS);

    /* O array entra no estado exatamente como veio, sem ordenar nem filtrar
       no caminho. Daqui para frente ele é a fonte canônica: toda visão da
       tela é uma cópia derivada dele, e ele mesmo nunca muda. */
    estado.tarefas = tarefas;
    estado.erro = null;
  } catch (erro) {
    /* O console ajuda quem está desenvolvendo, mas não é a tela do usuário:
       a mensagem também precisa aparecer na página. */
    console.error('Falha ao carregar as tarefas:', erro);
    estado.erro = erro;

    /* Origem vazia e resultado vazio NÃO passam por aqui. O `catch` é só
       para falha de verdade: rede, protocolo, formato. Um array sem itens é
       uma resposta bem-sucedida, e é tratado no caminho do sucesso. */
  } finally {
    /* Terminou a espera — deu certo ou não. Quem decide qual tela aparece é
       `situacaoDaTela`, olhando o estado; um `finally` garante que a tela de
       carregando não fique presa se algo inesperado acontecer. */
    estado.carregamento = 'pronto';
    atualizar();
  }
}

/* Auxílio de verificação (teste 1 do enunciado).
   Módulos ES têm escopo próprio: sem isto, `estado` não existiria no Console
   do DevTools. Com isto, é possível conferir a fonte canônica à mão:

     app.estado.tarefas.map(t => t.id).join(',')   // ordem original
     app.derivarVisiveis(app.estado).length        // quantas estão visíveis

   O objeto é congelado para expor a leitura sem virar uma segunda porta de
   entrada por onde a aplicação poderia ser controlada de fora.             */
globalThis.app = Object.freeze({ estado, derivarVisiveis, atualizar });

/* Sem await de nível superior: a espera acontece dentro de `iniciar`.
   Aqui a função apenas é chamada, e o módulo termina de executar na hora. */
iniciar();
