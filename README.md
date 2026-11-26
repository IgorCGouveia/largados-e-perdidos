# Largados & Perdidos

> Aqui não tem crocodilagem!

Sistema de achados e perdidos do Centro de Informática (CI) da UFPB. Ele substitui a divulgação por e-mail: a comunidade cadastra o item achado, consulta o catálogo e pede a retirada, e a secretaria registra a devolução. Itens que ninguém procura seguem para reaproveitamento, doação ou descarte.

O app implementa as **8 telas** definidas na especificação do Marco II. O login decide o perfil: quem é da comunidade cai no catálogo, e a secretaria cai no painel de gestão. O layout se adapta ao aparelho: no celular, abas embaixo; no computador, menu no topo e catálogo em grade.

## Como usar

**Online:** https://igorcgouveia.github.io/largados-e-perdidos/

- **Comunidade:** entre com qualquer e-mail `@academico.ufpb.br`. No primeiro acesso, o app pede nome, matrícula e uma senha para criar a conta.
- **Secretaria (gestor):** `secretaria@academico.ufpb.br`, senha `secretaria`.
- O catálogo pode ser consultado sem entrar. Cadastrar e solicitar retirada pedem login.

> Ainda não há servidor: contas, itens e pedidos ficam guardados no navegador (`localStorage`). Para testar o fluxo completo, use o mesmo navegador: peça um item como aluno, saia e entre como secretaria. O sistema real terá um banco de dados compartilhado e login pela conta institucional.

### Fluxo completo

1. Entre como aluno, abra um item e toque em **É meu! Solicitar retirada**.
2. Saia (em **Perfil**) e entre como secretaria.
3. Em **Solicitações**, aprove o pedido e clique em **Registrar devolução**.
4. Em **Destinação**, escolha um item abandonado e registre a doação.

### Rodar localmente

Não tem build nem dependências. Abra o `index.html` no navegador, ou sirva a pasta:

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

## As 8 telas e os requisitos que cobrem

| # | Tela | Perfil | Rota | Requisitos |
|---|------|--------|------|------------|
| 1 | Login | Usuário, celular | `#/login` | RF01, RF02 |
| 2 | Catálogo de achados | Usuário, celular | `#/catalogo` | RF07, RF08, RF09 |
| 3 | Detalhe e retirada | Usuário, celular | `#/item/:id` | RF10, RF11 |
| 4 | Cadastrar item | Usuário, celular | `#/cadastrar` | RF03, RF04, RF05 |
| 5 | Catálogo de abandonados | Usuário, celular | `#/abandonados` | RF18, RF19 |
| 6 | Solicitações pendentes | Gestor, computador | `#/secretaria/solicitacoes` | RF12, RF13 |
| 7 | Registrar devolução | Gestor, computador | `#/secretaria/devolucao/:id` | RF14, RF15 |
| 8 | Registrar destinação | Gestor, computador | `#/secretaria/destinacao` | RF20 |

Telas de apoio: **Perfil** do usuário (minhas solicitações e aviso de LGPD), **Itens** do gestor (todos os itens, com status e data limite) e **Configurações** (prazo de permanência, horário de retirada e lista editável de critérios de conferência).

### Regras que vieram da entrevista com a secretaria

| O que ouvimos | Como aparece no app |
|---|---|
| Só uma foto no e-mail | Cadastro com código único (`LP-0043`), dados do item e quem cadastrou |
| Prazo de dois períodos, sem controle individual | Prazo em dias configurável e data limite por item. A rotina diária marca o item como “Abandonado” (RF17, RNF06) |
| Itens úteis doados ao Centro Espírita | Destinação com tipo, destinatário, data e justificativa |
| Ninguém confirma quem é o dono | Critério de conferência escolhido numa lista editável |
| Sem controle de quem retirou | Devolução grava nome, matrícula, data/hora e gestor responsável, e entra no histórico do item |
| Conteúdo de comida e líquido é descartado | Aviso no formulário de cadastro |

### Requisitos não funcionais refletidos

- **RNF01, usabilidade:** formulário curto, categorias como botões grandes e passo a passo da retirada na tela do item.
- **RNF03, portabilidade:** layout responsivo a partir de 360 px, com versão de celular e de computador.
- **RNF09, proteção:** quem cadastrou, pediu ou retirou o item só aparece para o gestor. Itens de alto valor ou com dados pessoais não mostram foto no catálogo, só a descrição.
- **RNF12, LGPD:** o perfil informa quais dados são guardados, para quê e por quanto tempo.

## Decisões em aberto

Os pontos abaixo ainda dependem da secretaria e da direção do CI. O app usa valores provisórios, que podem ser trocados em **Configurações**:

- **Prazo padrão de permanência:** 90 dias. Hoje a secretaria guarda por cerca de dois períodos.
- **Horário de retirada:** segunda a sexta, 8h às 12h e 13h às 17h.
- **Critérios de conferência:** documento com foto, nome marcado no item, detalhe único e desbloqueio do aparelho.
- **Catálogo público ou com login:** o app deixa o catálogo aberto e pede login só para cadastrar e solicitar.
- **Login institucional:** hoje é e-mail `@academico.ufpb.br` e senha própria. A integração com a conta da UFPB (SIGAA) depende de servidor.
- **Prazo de retenção dos dados pessoais:** ainda não definido.

## Estrutura

```
index.html            página do app
css/styles.css        identidade visual e layout responsivo
js/icons.js           ícones SVG
js/data.js            categorias, locais, configuração, conta da secretaria e itens de exemplo
js/store.js           estado, contas, regras de negócio e persistência (faz o papel do back-end)
js/views-user.js      telas 1 a 5 e perfil
js/views-manager.js   telas 6 a 8, itens e configurações
js/app.js             roteador por hash, eventos, toasts e modal
assets/mascote.webp   mascote extraído da apresentação do Marco II
```

## Fontes

Feito a partir dos documentos da equipe: apresentação do Marco II (especificação de requisitos), lista de requisitos funcionais e não funcionais, elicitação de requisitos, roteiro e respostas da entrevista com a secretaria, matriz CSD, personas e mapas de empatia, e o feedback do Marco I.

**Equipe:** Yves Ribeiro, Eduardo Asfuri, Miracle Temitape, Pedro Henrique, Lucas Henrique e Igor Gouveia.

Os nomes, matrículas e itens de exemplo são fictícios.
