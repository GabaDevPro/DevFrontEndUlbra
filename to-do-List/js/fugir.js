/* ==========================================================================
   fugir.js — a saída de emergência (apresentação, e só)
   ==========================================================================

   Como `efeitos.js`, este módulo está deliberadamente FORA do ciclo de
   dados da aplicação: não importa nada, não é importado por ninguém, não lê
   nem escreve o estado, não toca em cartão, busca ou filtro.

   Ele cuida de uma coisa: o botão "Fugir", fixo no canto inferior direito
   da tela. O botão já é um link para a página raiz em modo de fuga
   (`../#fuga`), onde a encenação de destruir as provas termina no posto de
   controle, com o acesso negado de novo. Sem este arquivo, o link continua
   funcionando. O que ele acrescenta é `location.replace`: a saída
   substitui a entrada do quadro no histórico, e o "voltar" do navegador
   não devolve o visitante ao arquivo sem passar pelo "Hackear".
   ========================================================================== */

const botaoFugir = document.getElementById('fugir');

if (botaoFugir) {
  botaoFugir.addEventListener('click', (evento) => {
    /* Clique com modificador (nova aba, nova janela) segue o link normal. */
    if (evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey || evento.button !== 0) {
      return;
    }
    evento.preventDefault();
    location.replace(botaoFugir.href);
  });
}
