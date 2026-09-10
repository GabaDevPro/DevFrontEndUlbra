/* ==========================================================================
   efeitos.js — efeitos de ponteiro (apresentação, e só)
   ==========================================================================

   LEIA ISTO ANTES DE PROCURAR ESTADO AQUI DENTRO.

   Este módulo está deliberadamente FORA do ciclo de dados da aplicação:

     - não importa `estado.js`, `derivar.js` nem `renderizacao.js`;
     - não é importado por `main.js` — é um segundo ponto de entrada,
       declarado à parte no `index.html`;
     - não lê nem escreve o estado, não deriva lista, não cria nem remove
       cartão nenhum.

   A única coisa que ele toca são duas propriedades personalizadas de CSS
   (`--ponteiro-x` e `--ponteiro-y`) no elemento raiz. Quem decide o que fazer
   com elas é o `styles.css`. Se este arquivo não carregar, a página continua
   inteira e funcionando: perde-se o facho de luz da lanterna, nada mais.

   Essa separação é o ponto: a posição do mouse é informação de
   apresentação, não estado da aplicação. Guardá-la no objeto de estado
   forçaria uma renderização a cada pixel de movimento do mouse — e faria a
   tela ser redesenhada por um dado que nenhum cartão, contagem ou mensagem
   usa para nada.
   ========================================================================== */

/** Só faz sentido com mouse de verdade: dedo não tem "posição de repouso". */
const PONTEIRO_FINO = '(hover: hover) and (pointer: fine)';
const MOVIMENTO_REDUZIDO = '(prefers-reduced-motion: reduce)';

function ligarLanterna() {
  const raiz = document.documentElement;

  let x = 0;
  let y = 0;
  let agendado = false;

  /* O evento de mouse dispara muito mais vezes por segundo do que a tela é
     capaz de desenhar. Escrever na propriedade a cada evento seria trabalho
     jogado fora; `requestAnimationFrame` junta tudo o que chegou e escreve
     uma vez por quadro. `passive: true` avisa o navegador de que este
     ouvinte nunca vai cancelar o evento, e ele pode rolar a página sem
     esperar por nós. */
  function agendar() {
    if (agendado) return;
    agendado = true;
    window.requestAnimationFrame(() => {
      raiz.style.setProperty('--ponteiro-x', `${x}px`);
      raiz.style.setProperty('--ponteiro-y', `${y}px`);
      agendado = false;
    });
  }

  window.addEventListener('pointermove', (evento) => {
    /* Só o mouse acende a lanterna. Um toque na tela também dispara
       pointermove, e aí o facho ficaria parado onde o dedo encostou. */
    if (evento.pointerType !== 'mouse') return;
    x = evento.clientX;
    y = evento.clientY;
    agendar();
  }, { passive: true });

  /* Ponteiro fora da janela: o facho se apaga em vez de ficar preso na
     última posição, o que denunciaria o truque. */
  document.addEventListener('mouseleave', () => {
    raiz.classList.remove('lanterna-acesa');
  });

  document.addEventListener('mouseenter', () => {
    raiz.classList.add('lanterna-acesa');
  });

  /* A classe é o interruptor: sem JavaScript, o CSS da lanterna nunca entra
     em cena, e a página não fica com um facho apagado no meio da tela. */
  raiz.classList.add('com-lanterna', 'lanterna-acesa');
}

export function ligarEfeitosDePonteiro() {
  /* Quem pediu menos movimento não recebe lanterna nenhuma: o facho seguindo
     o cursor é exatamente o tipo de animação contínua que a preferência
     `prefers-reduced-motion` existe para dispensar. */
  if (window.matchMedia(MOVIMENTO_REDUZIDO).matches) return;
  if (!window.matchMedia(PONTEIRO_FINO).matches) return;

  ligarLanterna();
}

ligarEfeitosDePonteiro();
