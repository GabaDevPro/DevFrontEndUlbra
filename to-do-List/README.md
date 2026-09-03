# Quadro de Tarefas — E3

Gerenciador de tarefas acadêmicas. Nesta entrega os dados deixaram de ser um
array escrito no JavaScript e passaram a vir de `dados.json`, carregado pela
rede com `fetch`.

## Como rodar

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
| `js/api.js` | `carregarTarefas()` — busca, confere e devolve o array. Não toca no DOM. |
| `js/estados.js` | `renderizarEstado(estado, dados)` — decide qual das quatro telas aparece. Não faz requisição. |
| `js/renderizacao.js` | `renderizarTarefas(array)` — desenha os cartões. Inalterado desde a aula 5. |
| `js/main.js` | Liga as peças: pede os dados e manda desenhar. Único com `try/catch`. |
| `js/dados.js` | Array antigo da E2. **Aposentado**, não é importado por ninguém. |
| `testes/` | Arquivos para reproduzir os estados de vazio e de erro de formato. |

## Os quatro estados

| Estado | Quando acontece | O que aparece |
|---|---|---|
| `carregando` | Aplicado **antes** do `await` | Painel "Carregando tarefas…" |
| `sucesso` | Veio array com itens | O quadro, e a contagem na região de status |
| `vazio` | `tarefas.length === 0` | Painel explicando que não há tarefas |
| `erro` | Qualquer falha, via `catch` | Painel com mensagem específica do tipo de falha |

## Como reproduzir cada teste do enunciado

Troque a constante `CAMINHO_DOS_DADOS`, no topo de `js/main.js`:

| Teste | Valor | Resultado esperado |
|---|---|---|
| Sucesso | `'dados.json'` | 10 cartões |
| Vazio | `'testes/vazio.json'` | Painel de vazio, **não** de erro |
| 404 | `'testes/nao-existe.json'` | Painel de erro de **protocolo** |
| JSON quebrado | `'testes/formato-invalido.json'` | Painel de erro de **formato** |
| Carregando | `'dados.json'` + DevTools → Network → *Slow 4G* | Painel de carregando visível |
| Rede | `'dados.json'` + DevTools → Network → *Offline* | Painel de erro de **rede** |

## As perguntas do Q3

**Por que o `fetch` não rejeitou no 404?**
Para o `fetch`, a promessa só rejeita quando a requisição *não acontece* —
máquina offline, DNS que não resolve, servidor inalcançável. Um 404 é uma
resposta: a viagem até o servidor deu certo, e o servidor respondeu "não
tenho". Do ponto de vista da rede isso é sucesso. Por isso `resposta.ok`
(true apenas entre 200 e 299) precisa ser conferido à mão, e o 404 vira erro
com um `throw` nosso, em `js/api.js`.

**Por que existem duas esperas?**
São duas etapas distintas. O primeiro `await fetch(...)` resolve assim que
chegam o **status e os cabeçalhos** — o corpo do arquivo ainda está vindo.
O segundo, `await resposta.json()`, espera o **corpo terminar de chegar** e
ser convertido de texto para objeto. Separar as duas é o que permite conferir
`resposta.ok` antes de tentar interpretar como JSON o corpo de uma página de
erro.

**Onde cada tipo de erro é tratado?**
Todos são *lançados* em `js/api.js` e *tratados* num único `catch`, em
`js/main.js`. Quem escolhe a mensagem é `js/estados.js`, olhando `erro.name`:

- `TypeError` → falha de **rede** (o `fetch` rejeitou sozinho)
- `ErroHttp` → falha de **protocolo** (nossa classe, lançada quando `!resposta.ok`)
- `SyntaxError` → falha de **formato** (JSON inválido, ou sem a chave `tarefas`)

**Por que o estado vazio não está no `catch`?**
Porque nada falhou. A requisição funcionou, o JSON era válido, o array
simplesmente veio sem itens. Mandar isso para o `catch` faria a tela acusar um
erro que não existe. Em `js/main.js` o vazio é decidido no caminho de sucesso,
por `tarefas.length === 0`.

**Por que a região de status precisa existir antes da mudança?**
O leitor de tela anuncia alterações de elementos que ele **já estava
observando**. Uma região criada junto com a mensagem entra no documento já
preenchida, e essa inserção não é lida. Por isso o elemento está no
`index.html` desde o início, vazio, e só é preenchido depois por JavaScript.
Ele usa `aria-live="polite"`, que espera a pessoa terminar o que está lendo —
`assertive` interromperia a leitura e é reservado a emergências.

## O que ficou fora da E3

Conforme o enunciado, esta entrega **não** inclui:

- consumo de API pública externa;
- busca e filtros funcionando — os controles continuam na tela, sem operar;
- cadastro, edição ou exclusão de tarefas;
- estado da interface centralizado (aula 7);
- botão de tentar novamente;
- qualquer biblioteca ou framework.

O botão *Buscar* é `type="button"` de propósito: como não há JavaScript
tratando o formulário, um `type="submit"` recarregaria a página a cada clique.
Assim o controle existe e não faz nada, que é o comportamento pedido.
