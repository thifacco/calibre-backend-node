# Arquitetura — Calibre back-end

Documento de referência do back-end. A fonte da verdade do escopo é o brief de produto; este arquivo traduz o brief em decisões técnicas do repositório.

## Camadas

Estrutura em `/api`, com fluxo estritamente unidirecional:

```
/api
  /routes         → definição de rotas Express
  /controllers    → lida com req/res, chama services
  /services       → lógica de negócio, acessa /repositories
  /repositories   → acesso direto ao MongoDB (driver nativo ou Mongoose)
  /models         → schemas Mongoose
```

```
routes → controllers → services → repositories → MongoDB
```

Regra não negociável: **controller nunca acessa o banco diretamente**. Sempre controller → service → repository.

O motivo é testabilidade: as camadas devem ser finas o suficiente para serem testadas isoladamente, com o repository mockado nos testes de service. Uma consulta feita direto no controller quebra isso e não tem como ser coberta sem subir banco.

## Contrato de API

O front-end vive em repositório e deploy separados e espera **exatamente** este contrato. Qualquer mudança de shape de resposta ou de rota é breaking change e precisa ser sincronizada com o repositório de front-end antes de entrar.

| Método | Rota | Auth | Body / Query | Descrição |
|---|---|---|---|---|
| POST | `/api/users` | não | `{ name, email, password }` | cadastro — hash da senha antes de salvar, sem envio de e-mail |
| POST | `/api/session` | não | `{ email, password }` | login — retorna `{ token, userId, name }` |
| GET | `/api/feed` | não | `?cursor=&q=` | feed paginado por cursor, filtro opcional por marca/modelo |
| POST | `/api/items` | Bearer | `NewCollectionItemInput` | cria item de coleção do usuário autenticado |
| GET | `/api/items?userId=` | Bearer | — | itens de um usuário (dashboard) |
| POST | `/api/items/:id/reactions` | Bearer | `{ type }` | reagir a um item |
| POST | `/api/items/:id/comments` | Bearer | `{ content }` | comentar em um item |

Tipos:

- `ReactionType`: `"TOUCHED" | "CURIOUS" | "SAME_STORY"`
- `GET /api/feed` retorna `{ items: FeedItem[], nextCursor: string | null }`
- `FeedItem` inclui `userName` já desnormalizado — o front não faz join

Regras de comportamento:

- `POST /api/items/:id/reactions` precisa impedir reação duplicada do mesmo tipo pelo mesmo usuário.

### Respostas e status

O brief define o corpo de `POST /api/session` e `GET /api/feed`. **O resto foi decidido na implementação** — se o front-end espera outra coisa, é aqui que muda.

| Rota | Status | Corpo |
|---|---|---|
| `POST /api/users` | 201 | `{ id, name, email, createdAt }` — nunca inclui `passwordHash` |
| `POST /api/session` | 200 | `{ token, userId, name }` *(do brief)* |
| `GET /api/feed` | 200 | `{ items, nextCursor }` *(do brief)* |
| `POST /api/items` | 201 | o `FeedItem` criado |
| `GET /api/items?userId=` | 200 | `{ items: FeedItem[] }` |
| `POST /api/items/:id/reactions` | 201 | `{ reactionCounts }` já atualizado |
| `POST /api/items/:id/comments` | 201 | `{ id, itemId, userId, userName, content, createdAt }` |

Erros seguem `{ error: { message, details? } }`. `details` só aparece em 400 de validação, com `[{ field, message }]`.

| Status | Quando |
|---|---|
| 400 | corpo/query inválidos, cursor corrompido, id malformado |
| 401 | token ausente, inválido ou expirado; credenciais erradas no login |
| 404 | item inexistente |
| 409 | e-mail já cadastrado; reação duplicada |

### Paginação do feed

Página de 20 itens, ordenada por `createdAt` desc com `_id` como desempate. O cursor é uma string opaca (base64url de `createdAt|_id`) — o front só devolve o que recebeu.

`createdAt` sozinho não serve de cursor: dois itens criados no mesmo milissegundo fariam a paginação pular ou repetir registros. Por isso o índice é composto `{ createdAt: -1, _id: -1 }`.

A consulta busca 21 registros para saber se existe próxima página sem uma segunda query. O `nextCursor` aponta para o vigésimo — o último **entregue**, não a sonda.

O filtro `q` casa parcialmente, sem diferenciar maiúsculas, contra `brand` ou `model`. O termo é escapado antes de virar regex.

## Autenticação

1. O usuário define a própria senha no cadastro (o campo de confirmação é validado no front-end).
2. `POST /api/users` recebe `{ name, email, password }` e salva o hash (bcrypt ou equivalente). Sem envio de e-mail nesta fase.
3. `POST /api/session` valida o hash e retorna um token — JWT simples é suficiente para o MVP.
4. Rotas autenticadas validam o header `Authorization: Bearer <token>`.

## Modelagem de dados

MongoDB orientado a documentos, **não** relacional. Denormalizar o que é sempre lido junto.

```ts
// users
{
  _id: ObjectId,
  name: string,
  email: string,          // unique index
  passwordHash: string,
  avatarUrl?: string,
  createdAt: Date
}

// collectionItems
{
  _id: ObjectId,
  userId: ObjectId,
  userName: string,       // desnormalizado — renderiza o feed sem join
  brand: string,
  model: string,
  referenceNumber?: string,
  movementType?: "MANUAL" | "AUTOMATIC" | "QUARTZ" | "ECO_DRIVE" | "SPRING_DRIVE" | "OTHER",
  acquiredYear?: number,
  acquiredContext?: string,
  memoryStory: string,
  photos: string[],       // URLs, embutido — sem coleção separada
  reactionCounts: {       // contadores desnormalizados, performance do feed
    touched: number,
    curious: number,
    sameStory: number
  },
  commentCount: number,
  createdAt: Date
}

// reactions — detalhe de quem reagiu
{
  _id: ObjectId,
  itemId: ObjectId,
  userId: ObjectId,
  type: "TOUCHED" | "CURIOUS" | "SAME_STORY",
  createdAt: Date
}

// comments
{
  _id: ObjectId,
  itemId: ObjectId,
  userId: ObjectId,
  userName: string,       // desnormalizado
  content: string,
  createdAt: Date
}
```

### Decisões que precisam ser preservadas

- `collectionItems.userName` e `comments.userName` são cópias de `users.name`. Existem para o feed renderizar sem join — não substituir por lookup.
- `collectionItems.photos` é array de URLs embutido, não coleção separada.
- `reactionCounts` e `commentCount` são contadores denormalizados para performance do feed.
- A coleção `reactions` guarda o detalhe de quem reagiu. O índice único composto `{ itemId: 1, userId: 1, type: 1 }` é o que impede reação duplicada — a validação não vive só na aplicação.

### Índices

| Coleção | Índice | Para quê |
|---|---|---|
| `users` | `email` (unique) | login e unicidade de cadastro |
| `collectionItems` | `createdAt` | feed paginado por cursor |
| `collectionItems` | `userId` | dashboard do usuário |
| `reactions` | `{ itemId, userId, type }` (unique) | bloqueia reação duplicada |

### Consistência dos contadores

Ao criar uma reação ou comentário, **incrementar o contador correspondente em `collectionItems` na mesma operação** — transação ou `findOneAndUpdate` atômico. Contador dessincronizado do detalhe é bug, não é aproximação aceitável.

## Limites de produto

O Calibre é um clube de colecionadores, **não** uma ferramenta de matching ou encontro. Isso tem duas consequências diretas no back-end:

- Não armazenar geolocalização, endereço ou qualquer dado físico de usuário em nenhuma entidade.
- Não criar entidade de "encontro" ou "match". A interação é 100% social — comentar e reagir —, nunca logística.
