# CLAUDE.md

Este arquivo orienta o Claude Code (claude.ai/code) ao trabalhar com o código deste repositório.

## Comandos

```bash
npm run dev                        # servidor local na porta 4000, com reload
npm run build                      # compila para dist/
npm start                          # roda o build
npm run typecheck                  # tsc --noEmit
npm test                           # suíte completa
npm run test:watch                 # suíte em watch
npx vitest run src/app.test.ts     # um arquivo isolado
npx vitest run -t "nome do teste"  # um teste isolado
```

Rodar o servidor exige `.env` preenchido (ver `.env.example`) — `src/config/env.ts` derruba o processo no boot se faltar variável, listando o que falta. Os testes não precisam de `.env`: o ambiente vem do `vitest.config.ts`.

## Estado atual

As sete rotas do contrato estão implementadas nas quatro camadas, com 41 testes passando em 8 arquivos.

Os sete endpoints já rodaram contra um MongoDB real (local, 8.3) em 18/08/2026: cadastro, login, criação de item, feed, reação, reação duplicada recusada com 409 e comentário. As collections e os índices foram criados pelo boot, e os contadores do item bateram com o detalhe gravado — as transações funcionaram.

Ainda não rodou contra o Atlas. E o caminho feliz continua sem teste automatizado: a suíte usa repository mockado, a verificação contra banco foi manual.

**Transações exigem replica set.** `reactionRepository` e `commentRepository` falham em `mongod` standalone. O ambiente local foi convertido para replica set de nó único (`rs0`) por causa disso — a connection string precisa do `?replicaSet=rs0`.

**Não existe CORS.** `createApp()` não monta nenhum middleware de CORS, então nenhum browser em outra origem consegue chamar esta API — nem no feed público. O front-end contorna proxiando `/api/*` pelo servidor do Next, o que deixa tudo same-origin no ambiente local e não exigiu mudança aqui. Um deploy real vai exigir `cors` neste repositório.

## Como os testes são escritos

Nenhum teste toca banco, e é isso que mantém a suíte rodando em segundos sem Atlas nem `mongod`. Dois padrões, conforme a camada:

- **Service** (`src/api/services/*.test.ts`) — `vi.mock` do módulo de repository **antes** do import do service, e `vi.mocked()` para tipar o dublê. `restoreMocks: true` no `vitest.config.ts` limpa tudo entre testes; não escreva `afterEach` de limpeza.
- **Rota** (`src/api/routes/routes.test.ts`, `src/app.test.ts`) — `createApp().listen(0)` numa porta efêmera e `fetch` contra ela. Sem supertest, não é dependência do projeto.

Os testes de rota cobrem só o que roda **antes** do banco: auth e validação. Caminho feliz de rota chega ao repository e ficaria dependente de Mongo — é a lacuna conhecida da suíte, não um esquecimento.

## Convenções do código

- **ESM com extensão `.js` nos imports.** `"type": "module"` + `moduleResolution: NodeNext` — importe `./foo.js` mesmo o arquivo sendo `foo.ts`. Sem a extensão, quebra em runtime.
- **`exactOptionalPropertyTypes` e `noUncheckedIndexedAccess` estão ligados.** Campos opcionais do contrato não aceitam `undefined` explícito, e indexar array devolve `T | undefined`.
- **Erros de negócio via `AppError`.** Os services lançam `badRequest`/`conflict`/`notFound` de `src/shared/AppError.ts`; o `errorHandler` traduz para HTTP. O Express 5 encaminha rejeições async sozinho — não escreva wrapper `asyncHandler`.
- **Shape de erro:** `{ error: { message, details? } }`. Foi escolhido no scaffold, não vem do brief — se o front-end esperar outro formato, é aqui que muda.
- **Tipos do contrato ficam em `src/shared/contracts.ts`.** Mudou lá, é breaking change.
- **Documento do Mongo não sai do service.** `src/api/services/mappers.ts` traduz doc → contrato (`_id` vira `id`, `Date` vira ISO, opcional ausente é **omitido**, não `undefined` — `exactOptionalPropertyTypes`). Service devolve tipo de `contracts.ts`; nunca `CollectionItemDoc` cru.
- **Auth:** `requireAuth` de `src/middleware/auth.ts` popula `req.auth.userId`; `signToken` emite o JWT do login.
- **`createApp()` não conecta no banco.** É o que permite testar HTTP sem Atlas — manter assim; a conexão vive em `src/server.ts`.

## Documentos de referência

- [ARQUITETURA.md](ARQUITETURA.md) — camadas, contrato de API, autenticação, modelagem e índices. **Leia antes de criar ou alterar rota, entidade ou consulta.**
- [README.md](README.md) — produto, stack, débitos técnicos aceitos.

O brief de produto (fora do repositório: `Documentos/Projetos Claude/Calibre/calibre-backend-brief.md`) é a fonte da verdade do escopo. Não é espaço para reabrir decisões de produto ou arquitetura.

O front-end vive em `calibre-frontend-react` (repositório separado, Next.js) e consome este contrato literalmente. O `ARQUITETURA.md` de lá espelha a tabela de rotas daqui — daqui é que ela sai.

## Invariantes

Regras que se violam por padrão quando ninguém avisa. Cada uma está explicada na seção correspondente do ARQUITETURA.md.

- **Controller nunca acessa o banco.** Sempre controller → service → repository, para o service ser testável com repository mockado.
- **Contador e detalhe mudam na mesma operação.** Criar reação ou comentário incrementa `reactionCounts`/`commentCount` atomicamente — transação ou `findOneAndUpdate`.
- **Denormalização é intencional.** `userName` duplicado em `collectionItems` e `comments`, `photos` embutido, contadores no item: existem para o feed não fazer join. Não "normalizar" isso.
- **Mudar rota ou shape de resposta é breaking change.** O front-end vive em outro repositório e espera o contrato literal — sincronizar antes de alterar.
- **Nunca commitar direto na `main`.** Criar branch antes (`git checkout -b <tipo>/<descricao>`), commitar nela e abrir PR. Um hook `PreToolUse` em `.claude/settings.json` bloqueia o commit se a branch for `main` ou `master` — a regra aqui existe para ramificar antes de esbarrar no bloqueio.
- **Nada de dado físico nem de encontro.** Sem geolocalização, endereço ou dado físico de usuário em nenhuma entidade; sem entidade de "match" ou "encontro". O Calibre é um clube, não uma ferramenta de matching.
