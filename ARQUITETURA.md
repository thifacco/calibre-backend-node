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
