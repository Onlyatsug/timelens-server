# Timelens — Backend

O **Timelens** é uma plataforma web dedicada à preservação de memórias institucionais, comunitárias e coletivas, usando localização geográfica e cronologia como pilares de navegação: cada memória é um post ancorado a um local do campus e a uma linha do tempo.

Este repositório contém a API REST que sustenta o [frontend do Timelens](../timelens-website), desenvolvida integralmente no escopo da disciplina de **Tópicos Especiais em Engenharia de Software**, sob o tema norteador *"Rede Social para Minorias"*.

> O projeto foi construído em **XP** por conta do prazo curto da disciplina. A ideia é continuar evoluindo o backend de forma constante — consolidando tópicos de *system design*, boas práticas e *clean code* — em vez de tratá-lo como entrega finalizada.

## Stack

- **Node.js** + **TypeScript**
- **Express** para a camada HTTP
- Dados em memória (mock), pensados para facilitar troca futura por um banco real

## Como rodar

```bash
cd timelens-backend
npm install
cp .env.example .env   # (to-do: montar env de exemplo)
npm run dev
```

O servidor sobe por padrão em `http://localhost:4000`.

## Estrutura

```
src/
  types.ts                    tipos de dados compartilhados
  store.ts                    controllers, regras de negócio e bagunça!
  app.ts                      configuração do Express e montagem das rotas
  server.ts                   ponto de entrada (sobe o servidor)
  routes/
    users.routes.ts
    locations.routes.ts
    posts.routes.ts
    comments.routes.ts
    notifications.routes.ts
    tags.routes.ts
    auth.routes.ts
  middleware/
    errorHandler.ts
  utils/
    date.ts                   formatDate / timeAgo
```

## Endpoints

Base URL: `http://localhost:4000/api`

### Usuários

| Método | Rota | Descrição |
|---|---|---|
| GET | `/users` | Lista todos os usuários |
| GET | `/users/:id` | Detalhe de um usuário |
| GET | `/users/:id/posts` | Memórias postadas por esse usuário |

### Locais do campus

| Método | Rota | Descrição |
|---|---|---|
| GET | `/locations` | Lista todos os locais |
| GET | `/locations/:id` | Detalhe de um local |
| GET | `/locations/:id/posts` | Memórias associadas a esse local |
| POST | `/locations` | Cria um novo local |

### Posts (memórias)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/posts` | Lista posts. Filtros via query: `?tag=`, `?locationId=`, `?authorId=`, `?type=`, `?search=` |
| GET | `/posts/:id` | Detalhe de um post |
| POST | `/posts` | Cria um post |
| PUT | `/posts/:id` | Atualiza um post |
| DELETE | `/posts/:id` | Remove um post (e seus comentários) |
| POST | `/posts/:id/like` | Curte/descurte (toggle). Body: `{ "userId": "u2" }` |
| GET | `/posts/:id/comments` | Lista comentários do post |
| POST | `/posts/:id/comments` | Cria comentário. Body: `{ "authorId": "u2", "content": "..." }` |

Body para criar post (`POST /posts`):

```json
{
  "title": "Título da memória",
  "content": "Descrição...",
  "image": "https://...",
  "eventDate": "2024-05-01",
  "authorId": "u2",
  "locationId": "loc1",
  "tags": ["#Evento", "#Coletivo"],
  "type": "event"
}
```

`type` aceita: `"event" | "project" | "collective" | "general"`.

### Comentários

| Método | Rota | Descrição |
|---|---|---|
| DELETE | `/comments/:id` | Remove um comentário |

### Notificações

| Método | Rota | Descrição |
|---|---|---|
| GET | `/notifications?userId=u2` | Notificações de um usuário |
| PATCH | `/notifications/:id/read` | Marca uma notificação como lida |
| PATCH | `/notifications/read-all` | Marca todas como lidas. Body: `{ "userId": "u2" }` |

> Curtir um post ou comentar gera automaticamente uma notificação para o autor do post (exceto quando o próprio autor curte/comenta a sua memória).

### Tags

| Método | Rota | Descrição |
|---|---|---|
| GET | `/tags` | Lista todas as tags em uso |
| GET | `/tags/:tag/posts` | Posts com essa tag (com ou sem `#` na URL) |

### Autenticação

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/login` | Login simplificado por e-mail. Body: `{ "email": "gustavo.santana@sou.ufmt.br" }` |
| POST | `/auth/sync` | Sincroniza um usuário autenticado no Firebase com o backend. Body: `{ "idToken": "...", "name"?: "..." }` |

## Conectando com o front

O [frontend](../timelens-website) já consome esta API através de `src/services/api.ts`. Para rodar tudo localmente, aponte a variável de ambiente do front (`VITE_API_URL` ou equivalente) para `http://localhost:4000/api`.

## Roadmap / débitos técnicos conhecidos

- [x] Persistência real (banco de dados).
- [ ] Autenticação própria com hash de senha + JWT
- [ ] Validação de payloads (ex.: Zod) nas rotas de escrita
- [ ] Banco de dados baseado em grafo
- [ ] Testes automatizados
- [ ] `.env.example` de fato preenchido
