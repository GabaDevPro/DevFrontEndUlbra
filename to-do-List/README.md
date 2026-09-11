# Quadro de Tarefas — E4

Gerenciador de tarefas acadêmicas. Nesta entrega os controles que existiam
desde a E1 passam a operar de verdade: busca, filtros, ordenação e limpeza.

**Aplicação publicada:** <https://gabadevpro.github.io/DevFrontEndUlbra/>

A regra que organiza todo o código desta etapa:

> **O estado é a fonte; a tela é uma projeção.**

Busca, filtros, ordenação, cartões, contagem e mensagens não podem discordar
entre si porque nenhum deles guarda informação própria — todos são desenhados
a partir do mesmo objeto de estado, na mesma passagem.

## Como rodar localmente

A página **precisa ser servida por HTTP**. Abrir o `index.html` com duplo
clique (protocolo `file:`) faz o `fetch` falhar e os módulos ES não carregam.

- VS Code: extensão **Live Server** → botão *Go Live*
- ou, no terminal, dentro da pasta `to-do-List/`:

```bash
python -m http.server 5500     # depois abra http://localhost:5500
```

## Estrutura

| Arquivo | Responsabilidade |
|---|---|
| `dados.json` | As tarefas. Documento raiz é um objeto com a chave `tarefas`. |
| `js/api.js` | `carregarTarefas()` — busca, confere e devolve o array. Não lê controles e não toca no DOM. |
| `js/estado.js` | O **objeto de estado único**, os valores iniciais e `limparCriterios()`. |
| `js/derivar.js` | `derivarVisiveis(estado)` — busca + filtros + ordenação. Função pura: não vê o DOM, não altera o estado. |
| `js/controles.js` | Os ouvintes (instalados uma vez) e a sincronização dos campos a partir do estado. |
| `js/estados.js` | `renderizarEstado(situacao, dados)` — decide qual das cinco telas aparece. Não faz requisição, não filtra. |
| `js/renderizacao.js` | `renderizarTarefas(array)` — desenha os cartões, na ordem em que recebeu. |
| `js/url.js` | **Desafio opcional.** Lê os critérios da barra de endereço (uma vez, na inicialização) e os escreve de volta a cada ciclo. |
| `js/main.js` | `atualizar()`, o ciclo único, e a inicialização. Único com `try/catch`. |
| `js/efeitos.js` | Efeitos de ponteiro (a lanterna). **Fora do ciclo de dados**: não importa nada, não é importado por ninguém e só escreve duas propriedades de CSS. |
| `js/dados.js` | Array antigo da E2. **Aposentado**, não é importado por ninguém. |
| `testes/` | Arquivos para reproduzir os estados de origem vazia e de erro de formato. |
| `../index.html` | Página na raiz do repositório, que redireciona para esta pasta no GitHub Pages. |

## O estado único

```js
export const estado = {
  tarefas: [],            // o array ORIGINAL, como veio de carregarTarefas()
  busca: '',              // texto do campo de busca
  status: '',             // '' = Todos
  prioridade: '',         // '' = Todas
  ordenacao: 'prazo-asc', // 'prazo-asc' | 'prazo-desc'
  carregamento: 'inicial',// 'inicial' | 'carregando' | 'pronto'
  erro: null,             // o erro atual, ou null
};
```

O que **não** existe aqui é tão importante quanto o que existe: não há
`tarefasVisiveis`. Uma segunda lista guardada no estado é uma segunda fonte de
verdade, e duas fontes de verdade acabam discordando — é o cartão que
desaparece da tela mas continua contado, ou a contagem que fica presa no
número anterior. A lista visível é **derivada** a cada ciclo e existe apenas
dentro dele.

`estado.tarefas` nunca é reordenado nem filtrado. `derivarVisiveis()` ordena
sempre uma cópia (`[...lista].sort(...)`), porque `sort()` reordena o próprio
array em que é chamado: um `sort()` sobre `estado.tarefas` destruiria a ordem
original de forma permanente, e nem "Limpar filtros" a traria de volta.

## O ciclo único

Todo evento — digitar na busca, mudar um `<select>`, clicar em "Limpar
filtros", clicar na ação de um cartão — faz exatamente duas coisas: escreve no
estado e chama `atualizar()`. Nenhum ouvinte desenha nada.

```js
export function atualizar() {
  const visiveis = derivarVisiveis(estado);      // derivada UMA vez por ciclo

  renderizarEstado(situacaoDaTela(visiveis), {   // cartões, contagem, mensagem
    visiveis,
    total: estado.tarefas.length,
    erro: estado.erro,
  });

  sincronizarControles(estado);                  // e os campos do formulário
  sincronizarURL(estado);                        // e a barra de endereço
}
```

A mesma lista alimenta os cartões, as contagens das colunas e a região de
status. Derivar duas vezes — uma para desenhar, outra para contar — é
exatamente como a tela passa a mostrar três cartões e escrever "4 de 10".

Os campos são sincronizados **aqui**, não dentro dos ouvintes. É por isso que
"Limpar filtros" precisa apenas devolver o estado aos valores iniciais: os
campos e os cartões voltam juntos, no mesmo ciclo, sem que o botão saiba o que
é um campo. A barra de endereço entrou na mesma lista, pelo mesmo motivo.

## Critérios na URL (desafio opcional)

Feito depois de todos os itens mínimos, e sem mexer em nenhum deles: nem
`derivar.js`, nem `renderizacao.js`, nem `estados.js` foram alterados.

O endereço acompanha a visão. Filtrar por prioridade alta e ordenar pelo prazo
mais distante deixa a barra assim:

```
https://gabadevpro.github.io/DevFrontEndUlbra/to-do-List/?prioridade=alta&ordenacao=prazo-desc
```

Copiar esse endereço e abri-lo em outra janela reabre exatamente o mesmo
quadro, com os campos do formulário já preenchidos.

### O estado continua sendo a verdade

A URL é uma **segunda forma de entrada**, e é aí que mora o risco de a entrega
ganhar duas fontes de verdade. A regra adotada:

| | |
|---|---|
| **Leitura** | URL → estado, **uma vez só**, na primeira linha de `iniciar()`, antes dos ouvintes e do primeiro desenho. |
| **Escrita** | estado → URL, **todo ciclo**, dentro de `atualizar()`, ao lado de `sincronizarControles`. |

Depois daquela única leitura, a barra de endereço tem exatamente o mesmo papel
de um `<select>`: mostra o que o estado diz e nunca decide nada. O que veio da
URL não fica guardado em lugar nenhum — vira estado como qualquer outro
critério e perde a origem privilegiada.

### Três decisões que valem explicação

**`replaceState`, não `pushState`.** A busca reage a cada tecla. Com
`pushState`, digitar "biblioteca" empilharia onze entradas no histórico, e sair
da página exigiria apertar Voltar onze vezes. A visão atual substitui a
anterior, e o botão Voltar continua significando "sair desta página".

**Valor do padrão não vai para a URL.** O quadro sem filtro nenhum tem endereço
limpo, sem `?`. Como consequência, "Limpar filtros" também apaga a consulta da
barra — o endereço acompanha o botão em vez de guardar o rastro de um filtro
que já saiu de cena.

**Todo valor que chega da URL é conferido.** `?prioridade=urgente` é texto que
qualquer pessoa pode digitar, e nenhum `<select>` consegue produzi-lo. Se
entrasse no estado, o quadro ficaria vazio enquanto o campo mostraria "Todas" —
porque atribuir a `value` um texto sem `<option>` correspondente faz o
navegador cair silenciosamente para a primeira opção. Estado e controle
passariam a contar histórias diferentes. Por isso `estado.js` declara
`VALORES_VALIDOS`, e o que não estiver no vocabulário é **ignorado**: o
critério fica no valor inicial e o endereço quebrado abre o quadro inteiro, em
vez de virar erro ou tela em branco. `busca` é a exceção — texto livre não tem
vocabulário, e ela só alimenta um `includes`, nunca é interpretada como HTML.

### Por que não há ouvinte de `popstate`

Como a escrita usa `replaceState`, filtrar nunca empilha entradas no
histórico — então não existe "voltar para o filtro anterior" a ser tratado. As
outras formas de chegar a um endereço (colar na barra, abrir um favorito,
clicar num link) recarregam o documento, e aí a leitura da inicialização já dá
conta. Um ouvinte de `popstate` seria código que nunca dispara.

### Como conferir

1. Filtre, busque e ordene. A barra de endereço acompanha a cada mudança.
2. Copie o endereço, abra numa janela anônima. O quadro volta igual, com os
   campos preenchidos.
3. Clique em "Limpar filtros". A consulta some da barra.
4. Digite `?prioridade=urgente&status=fazer` à mão. `urgente` é descartado,
   `fazer` é aplicado — e o `<select>` de status mostra "A fazer".
5. No Console: `app.estado` continua com as mesmas sete chaves. A URL não
   acrescentou nenhuma.

## As cinco telas

| Situação | Quando acontece | O que aparece |
|---|---|---|
| `carregando` | Aplicada **antes** do `await` | Painel "Carregando tarefas…" |
| `erro` | Qualquer falha, via `catch` | Painel com a mensagem do tipo de falha |
| `vazio` | `estado.tarefas.length === 0` | Painel de origem sem tarefas |
| `sem-resultados` | Há tarefas, a lista derivada está vazia | Painel orientando a alterar ou limpar os critérios |
| `sucesso` | Há tarefas visíveis | O quadro, e "N de M tarefas" na região de status |

`vazio` e `sem-resultados` produzem telas parecidas e não são a mesma coisa:
na primeira não há nada para encontrar; na segunda há, e basta mudar um
critério. Dar a mesma mensagem às duas faz alguém procurar defeito no arquivo
de dados quando o "defeito" é um filtro ligado.

E nenhuma das duas é `erro`. `sem-resultados` é decidido pelo tamanho da lista
derivada, no caminho de sucesso — não pelo `catch`.

## Acessibilidade

- A região de resultados (`#regiao-status`) já vem no `index.html`, vazia, com
  `role="status"` e `aria-live="polite"`. O leitor de tela só anuncia
  alterações de elementos que **já estava observando**: uma região criada
  junto com a mensagem não anuncia nada.
- Depois de cada mudança ela informa "Mostrando N de M tarefas", ou a
  mensagem equivalente das outras situações.
- `polite` espera a pessoa terminar o que está lendo. `assertive`
  interromperia a leitura, e é reservado a emergências.
- **A atualização não move o foco.** Os controles ficam no `<header>` e nunca
  são recriados, então quem digita não é interrompido. Já os botões dentro dos
  cartões desaparecem a cada desenho: `atualizar()` guarda a identidade do
  botão focado antes de redesenhar e devolve o foco ao equivalente depois —
  isso não é mover o foco, é impedir que a renderização o mova.
- `sincronizarControles()` só escreve em `value` quando o valor mudou de
  verdade. Reescrever o mesmo texto num campo pode mandar o cursor para o fim
  em alguns navegadores, e quem estivesse editando o meio de uma palavra veria
  o cursor pular a cada letra.

## Delegação de eventos

Cada cartão tem um botão "Ver só prioridade …". O ouvinte **não** está no
botão: está no `<main>`, instalado uma única vez, e identifica o alvo com
`evento.target.closest('[data-acao="filtrar-prioridade"]')`.

Um ouvinte por cartão morreria junto com o nó antigo a cada redesenho, e
reinstalá-lo em cada ciclo é como se acumulam ouvintes duplicados — o clique
que dispara duas, cinco, dez vezes. Ouvindo no ancestral, um cartão criado no
décimo primeiro desenho já funciona sem que nada precise ser religado.

A ação do cartão também não desenha nada: ela escreve em `estado.prioridade` e
chama `atualizar()`. O `<select>` de prioridade se ajusta sozinho no mesmo
ciclo — o que é uma boa demonstração de que os controles são projeção do
estado, e não a origem dele.

## Carrossel das colunas no mobile

Abaixo de **40rem** as quatro pastas ficam empilhadas, e a página virava uma
coluna longuíssima: com dez cartões, chegar da primeira pasta ao rodapé exigia
várias telas de rolagem. Cada pasta passou a mostrar **um cartão por vez**, com
os demais ao lado, alcançáveis arrastando na horizontal. A partir de 40rem, com
as pastas lado a lado, a pilha vertical volta.

### É só CSS, e isso é o ponto

Não há uma linha de JavaScript no carrossel — `scroll-snap` nativo sobre um
contêiner com `overflow-x: auto`. A escolha não é economia; é o que o mantém
compatível com as regras da entrega:

- **Nada para religar depois de `replaceChildren()`.** A rolagem é propriedade
  da trilha (`<ul>`), que nunca é substituída, e não dos cartões, que entram e
  saem a cada desenho.
- **Nenhum ouvinte percorre cartões** para mostrar um e esconder os outros —
  justamente o que o enunciado proíbe. Todos os cartões estão visíveis ao mesmo
  tempo; o que muda é qual pedaço da trilha está à vista.
- **Todos continuam no documento e na ordem de leitura.** Quem usa leitor de
  tela encontra os dez, não só o que está na área visível.
- **O Tab continua funcionando sozinho.** O botão de cada cartão é um ponto de
  parada, e o navegador rola a trilha até ele sem código nenhum.

"Arrastar" aqui é o gesto de rolagem nativo do navegador, não o *drag and drop*
de cartões que a entrega exclui: nenhum cartão muda de coluna, de posição ou de
dado. A ordem continua sendo decidida em `derivar.js`; a trilha só a exibe.

### A afordância, sem seta nem bolinha

Cada cartão ocupa **87%** da trilha. A fatia do próximo espiando na borda é o
que avisa que há mais ali dentro — e quantos são, o contador ao lado do título
da pasta já diz (`EM ANDAMENTO (3)`). Setas e indicadores exigiriam JavaScript
com um ouvinte de rolagem marcando qual cartão está ativo, o que seria
exatamente o tipo de código que percorre cartões.

### O único ajuste que o JavaScript precisou

`replaceChildren()` troca os cartões e, junto com eles, zera a posição de
rolagem da trilha. Se o foco estava no botão de um cartão que agora é o
terceiro da fila, `devolverFoco()` o devolveria para **fora da área visível** —
o teclado num lugar e o olho em outro.

Por isso `main.js` passou a rolar a trilha até o cartão focado. Só a trilha:
mexer em `scrollLeft` de um elemento não toca na rolagem da página, e é por
isso que ali não serve `scrollIntoView()`, que ajustaria todos os ancestrais.
Isso não move o foco — move a janela por onde se olha para ele. Fora do
carrossel, a conta dá zero e nada acontece.

### A garantia da E2 continua de pé

A trilha rola; **a página não**. Medido com o Chrome a 320px:
`documentElement.scrollWidth` é 320 e `clientWidth` é 320 — sem rolagem
horizontal no documento. E `overscroll-behavior-x: contain` faz o gesto morrer
na trilha: continuar arrastando depois do último cartão não empurra a página
de lado.

## Como reproduzir cada situação

Troque a constante `CAMINHO_DOS_DADOS`, no topo de `js/main.js`:

| Teste | Valor | Resultado esperado |
|---|---|---|
| Sucesso | `'dados.json'` | 10 cartões, "Mostrando 10 de 10 tarefas." |
| Origem vazia | `'testes/vazio.json'` | Painel de origem vazia, **não** de erro |
| 404 | `'testes/nao-existe.json'` | Painel de erro de **protocolo** |
| JSON quebrado | `'testes/formato-invalido.json'` | Painel de erro de **formato** |
| Carregando | `'dados.json'` + DevTools → Network → *Slow 4G* | Painel de carregando visível |
| Rede | `'dados.json'` + DevTools → Network → *Offline* | Painel de erro de **rede** |

O resultado vazio não precisa de arquivo nenhum: busque por `zzz`, ou combine
um status com uma prioridade que não existam juntos.

## Conferindo pelo Console

`main.js` expõe o estado em `globalThis.app` para permitir o primeiro teste do
enunciado — módulos ES têm escopo próprio, e sem isso `estado` não existiria
no Console:

```js
app.estado.tarefas.map(t => t.id).join(',')   // ordem original da fonte
app.estado.tarefas.length                     // sempre 10, com qualquer filtro
app.derivarVisiveis(app.estado).length        // quantas estão visíveis agora
```

Aplique busca, filtros e ordenação e rode as duas primeiras linhas de novo: a
ordem e a quantidade continuam as mesmas. Se mudassem, a derivação estaria
alterando o estado canônico.

## O que ficou fora da E4

Conforme o enunciado, esta entrega **não** inclui:

- frameworks ou bibliotecas de interface;
- Vite, bundler ou qualquer processo de build;
- API pública externa ou `json-server`;
- cadastro, edição e exclusão de tarefas;
- persistência em banco de dados ou `localStorage`;
- paginação, autenticação ou controle de acesso;
- arrastar e soltar cartões;
- Redux, reducer, store genérica ou sistema próprio de reatividade.

O botão "Buscar" voltou a ser `type="submit"`: agora existe JavaScript
tratando o formulário, e o `submit` é impedido com `preventDefault()`. Assim a
tecla Enter no campo de busca também funciona sem recarregar a página. A busca
em si é ao vivo, no evento `input` — o botão é uma confirmação, não a origem.

## Identidade visual

A estética imita um documento classificado liberado por FOIA — o tipo de
papel que a CIA publica no acervo CREST. As convenções não são inventadas:

| Convenção | Como aparece aqui | Referência |
|---|---|---|
| **Banner line** — a classificação mais alta do documento é repetida no cabeçalho **e** no pé de cada página | as duas faixas pretas, no topo e no fim | [ISOO, *Marking Classified National Security Information*](https://www.archives.gov/files/isoo/training/marking-booklet-revision.pdf) |
| **Código de cor dos cover sheets** — laranja SF 703 = TOP SECRET, vermelho SF 704 = SECRET, azul SF 705 = CONFIDENTIAL | a faixa larga na etiqueta de prioridade: alta, média e baixa recebem essas três cores | [32 CFR 2001.80](https://www.ecfr.gov/current/title-32/subtitle-B/chapter-XX/part-2001/subpart-H/section-2001.80) |
| **Bloco de autoridade de classificação** — "Derived From" e "Declassify On", no pé | o bloco acima da faixa final | [CDSE, *Marking Classified Information*](https://www.cdse.edu/Portals/124/Documents/jobaids/information/Marking_Classified_Information.pdf) |
| **Selo de liberação** — "Approved For Release", data e número de controle | o carimbo torto no rodapé | [MuckRock, guia do CREST](https://www.muckrock.com/news/archives/2017/sep/22/crest-search-guide/) |
| **Placa do perímetro** — fotografia proibida por 18 U.S.C. 795, uso de força letal autorizado | a tarja vermelha sob o título | [Area 51](https://en.wikipedia.org/wiki/Area_51), [Dreamland Resort](https://www.dreamlandresort.com/area51/drones.html) |
| **Tarja de sanitização** — o retângulo preto sobre o trecho suprimido | cobre o responsável de cada cartão | idem |

Três suportes se empilham: a **mesa escura**, a **pasta de papel-manilha** (as
colunas, com a aba recortada no canto) e a **fotocópia** (os cartões, com dois
furos de arquivo e textura de xerox). O texto vive sempre na fotocópia ou na
pasta, nunca na mesa — é isso que mantém o contraste alto apesar do fundo
escuro. Tipografia: **Special Elite** nos carimbos e títulos, **Courier
Prime** no texto datilografado.

Os 27 pares de cor que carregam informação foram conferidos nos dois modos de
cor, e todos passam o mínimo AA. Dois precisaram de ajuste: o laranja do
SF 703 ficava em 2,94:1 como faixa e foi escurecido para 3,18:1, e a pasta do
modo escuro foi clareada até a tinta fraca voltar a 5,06:1.

### Interação com o mouse

| Onde | O que acontece |
|---|---|
| Cartão | a folha se levanta da pasta, e o carimbo **CONSULTADO** aparece atravessado no canto |
| Nome do responsável | a **tarja de censura** desliza e libera o nome |
| Título da coluna | o carimbo torto se endireita quando o ponteiro entra na pasta |
| Botões | afundam três pixels e desalinham um grau, como carimbo batido à mão |
| Página inteira | um facho de **lanterna** segue o ponteiro sobre a mesa |
| Quadro | o cursor é uma **mira**, não uma flecha |

Só o facho de lanterna precisa de JavaScript, e ele mora em
[`js/efeitos.js`](js/efeitos.js) — **fora do ciclo de dados**, de propósito:

- não importa nada e não é importado por `main.js`; é um segundo ponto de
  entrada, declarado à parte no `index.html`;
- não lê nem escreve o estado, não deriva lista, não cria nem remove cartão;
- a única coisa que ele toca são duas propriedades personalizadas de CSS
  (`--ponteiro-x` e `--ponteiro-y`) no elemento raiz.

A posição do mouse é informação de apresentação, não estado da aplicação.
Guardá-la no objeto de estado forçaria uma renderização a cada pixel de
movimento — redesenhar a tela inteira por um dado que nenhum cartão, contagem
ou mensagem usa para nada.

O efeito ainda respeita três limites: só é instalado quando existe mouse de
verdade (`hover: hover` e `pointer: fine`), nunca quando `prefers-reduced-motion`
está ativo, e a camada do facho tem `pointer-events: none` — sem isso, uma
camada por cima da tela inteira roubaria todo clique da página.

A tarja e o carimbo têm o mesmo cuidado: onde não há mouse, o nome do
responsável aparece desde o início; o teclado libera a tarja por
`:focus-within`, já que o cartão tem um botão focável; e o texto continua no
documento, apenas coberto — leitor de tela lê o nome sempre. Todo o cenário
do dossiê (as faixas, a linha de controle, a placa, o bloco de autoridade e o
selo) é `aria-hidden="true"`: quem usa leitor de tela não tem nada a ganhar
ouvindo "TOP SECRET // GROOM LAKE // NOFORN" antes do título da página.

## Publicação

Publicado pelo **GitHub Pages**, a partir da branch padrão (`main`) e da pasta
raiz (`/`). A aplicação vive em `to-do-List/`, e o `index.html` da raiz
redireciona para lá, de modo que a URL curta abre o quadro:

<https://gabadevpro.github.io/DevFrontEndUlbra/>

Atenção ao nome da pasta: `to-do-List`, com **L** maiúsculo. O servidor do
GitHub Pages diferencia maiúsculas de minúsculas nos caminhos, ao contrário do
Windows — um link para `to-do-list/` funciona na máquina local e responde 404
na versão pública.
