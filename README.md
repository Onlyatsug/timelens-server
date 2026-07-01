# Timelens — Backend

API REST em Node.js + TypeScript + Express que serve os mesmos dados mock que
já estavam no front (`USERS`, `LOCATIONS`, `POSTS`, `COMMENTS`, `NOTIFICATIONS`),
agora com um servidor HTTP de verdade por trás.

Os dados ficam **em memória** (reiniciam a cada `npm run dev`/`npm start`).
Isso é suficiente para a fase atual do projeto; quando quiser persistência
real, troque o conteúdo de `src/store.ts` por chamadas a um banco (Postgres,
SQLite, Mongo etc.) — as assinaturas das funções continuam as mesmas, então
as rotas não precisam mudar.

## Como rodar

```bash
cd timelens-backend
npm install
npm run dev        # inicia com hot-reload em http://localhost:4000
```

Outros scripts:

```bash
npm run build       # compila para dist/
npm start           # roda a versão compilada (dist/server.js)
```

Copie `.env.example` para `.env` se quiser mudar a porta (padrão: `4000`).

## Estrutura

```
src/
  types.ts               tipos compartilhados (iguais aos do front)
  data/seed.ts            os mesmos dados mock que você já tinha
  store.ts                "banco de dados" em memória + regras de negócio
  app.ts                  configuração do Express e montagem das rotas
  server.ts               ponto de entrada (sobe o servidor)
  routes/
    users.routes.ts
    locations.routes.ts
    posts.routes.ts
    comments.routes.ts
    notifications.routes.ts
    tags.routes.ts
    auth.routes.ts
  middleware/errorHandler.ts
  utils/date.ts            formatDate / timeAgo, iguais às do front
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

> Curtir um post ou comentar gera automaticamente uma notificação para o
> autor do post (exceto quando o autor curte/comenta a própria memória).

### Tags
| Método | Rota | Descrição |
|---|---|---|
| GET | `/tags` | Lista todas as tags em uso |
| GET | `/tags/:tag/posts` | Posts com essa tag (com ou sem `#` na URL) |

### Autenticação (mock)
| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/login` | Login simplificado por e-mail. Body: `{ "email": "gustavo.santana@aluno.ufmt.br" }` |

Como os dados mock não têm senha, esse login apenas confere se o e-mail
existe e devolve o usuário. **Não é seguro para produção** — antes de usar
de verdade, adicione hash de senha (bcrypt) e emissão de token (JWT).

## Exemplos com curl

```bash
# Listar posts do tipo "event"
curl "http://localhost:4000/api/posts?type=event"

# Curtir um post
curl -X POST http://localhost:4000/api/posts/p1/like \
  -H "Content-Type: application/json" \
  -d '{"userId":"u2"}'

# Comentar em um post
curl -X POST http://localhost:4000/api/posts/p1/comments \
  -H "Content-Type: application/json" \
  -d '{"authorId":"u2","content":"Marco histórico!"}'
```

## Conectando com o front

No front, aponte suas chamadas `fetch`/`axios` para
`http://localhost:4000/api/...` no lugar de importar direto de
`data/mock.ts`. As formas dos objetos retornados são idênticas às
interfaces `User`, `CampusLocation`, `Post`, `Comment` e `Notification`
que você já tem — nenhum tipo do front precisa mudar.
