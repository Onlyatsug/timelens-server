# Timelens — Backend

O Timelens é uma plataforma web dedicada à preservação de memórias institucionais, comunitárias e coletivas, utilizando a localização geográfica e a cronologia como pilares de navegação.

Este sistema foi desenvolvido integralmente no escopo da disciplina de Tópicos Especiais em Engenharia de Software, sob o tema norteador "Rede Social para Minorias".

Desenvolvido em XP (devido ao pouco tempo), atualizarei o projeto e resolverei problemas vigentes de forma constante para consolidar tópicos de system design, boas práticas e clean code.

Esse repositório contempla:
API REST em Node.js + TypeScript + Express

## Como rodar
```bash
cd timelens-backend
npm install
npm run dev        
```

Copie `.env.example` para `.env` //(to-do: montar env exemplo).

## Estrutura

```
src/
  types.ts                   tipos de dados
  store.ts                   controllers, business rules e bagunça!
  app.ts                     configuração do Express e montagem das rotas
  server.ts                  ponto de entrada (sobe o servidor)
  routes/
    users.routes.ts
    locations.routes.ts
    posts.routes.ts
    comments.routes.ts
    notifications.routes.ts
    tags.routes.ts
    auth.routes.ts
  middleware/errorHandler.ts
  utils/date.ts               formatDate / timeAgo
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

## Conectando com o front
No front, aponte suas chamadas `fetch`/`axios` para
`http://localhost:4000/api/...`.
