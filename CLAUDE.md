# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos

```bash
npm run dev                        # servidor local na porta 4000, com reload
npm run typecheck                  # tsc --noEmit
npm test                           # suíte completa
npx vitest run src/app.test.ts     # um arquivo isolado
npx vitest run -t "nome do teste"  # um teste isolado
```

Rodar o servidor exige `.env` preenchido (ver `.env.example`) — `src/config/env.ts` derruba o processo no boot se faltar variável. Os testes não precisam de `.env`: o ambiente vem do `vitest.config.ts`.

## Estado atual

As sete rotas do contrato estão implementadas nas quatro camadas, com 41 testes passando.

Os sete endpoints já rodaram contra um MongoDB real (local, 8.3) em 18/08/2026: cadastro, login, criação de item, feed, reação, reação duplicada recusada com 409 e comentário. As collections e os índices foram criados pelo boot, e os contadores do item bateram com o detalhe gravado — as transações funcionaram.

Ainda não rodou contra o Atlas. E o caminho feliz continua sem teste automatizado: a suíte usa repository mockado, a verificação contra banco foi manual.

**Transações exigem replica set.** `reactionRepository` e `commentRepository` falham em `mongod` standalone. O ambiente local foi convertido para replica set de nó único (`rs0`) por causa disso — a connection string precisa do `?replicaSet=rs0`.

## Convenções do código

- **ESM com extensão `.js` nos imports.** `"type": "module"` + `moduleResolution: NodeNext` — importe `./foo.js` mesmo o arquivo sendo `foo.ts`. Sem a extensão, quebra em runtime.
- **`exactOptionalPropertyTypes` e `noUncheckedIndexedAccess` estão ligados.** Campos opcionais do contrato não aceitam `undefined` explícito, e indexar array devolve `T | undefined`.
- **Erros de negócio via `AppError`.** Os services lançam `badRequest`/`conflict`/`notFound` de `src/shared/AppError.ts`; o `errorHandler` traduz para HTTP. O Express 5 encaminha rejeições async sozinho — não escreva wrapper `asyncHandler`.
- **Shape de erro:** `{ error: { message, details? } }`. Foi escolhido no scaffold, não vem do brief — se o front-end esperar outro formato, é aqui que muda.
- **Tipos do contrato ficam em `src/shared/contracts.ts`.** Mudou lá, é breaking change.
- **Auth:** `requireAuth` de `src/middleware/auth.ts` popula `req.auth.userId`; `signToken` emite o JWT do login.
- **`createApp()` não conecta no banco.** É o que permite testar HTTP sem Atlas — manter assim; a conexão vive em `src/server.ts`.

## Documentos de referência

- [ARQUITETURA.md](ARQUITETURA.md) — camadas, contrato de API, autenticação, modelagem e índices. **Leia antes de criar ou alterar rota, entidade ou consulta.**
- [README.md](README.md) — produto, stack, débitos técnicos aceitos.

O brief de produto (fora do repositório: `Documentos/Projetos Claude/Calibre/calibre-backend-brief.md`) é a fonte da verdade do escopo. Não é espaço para reabrir decisões de produto ou arquitetura.

## Invariantes

Regras que se violam por padrão quando ninguém avisa. Cada uma está explicada na seção correspondente do ARQUITETURA.md.

- **Controller nunca acessa o banco.** Sempre controller → service → repository, para o service ser testável com repository mockado.
- **Contador e detalhe mudam na mesma operação.** Criar reação ou comentário incrementa `reactionCounts`/`commentCount` atomicamente — transação ou `findOneAndUpdate`.
- **Denormalização é intencional.** `userName` duplicado em `collectionItems` e `comments`, `photos` embutido, contadores no item: existem para o feed não fazer join. Não "normalizar" isso.
- **Mudar rota ou shape de resposta é breaking change.** O front-end vive em outro repositório e espera o contrato literal — sincronizar antes de alterar.
- **Nunca commitar direto na `main`.** Criar branch antes (`git checkout -b <tipo>/<descricao>`), commitar nela e abrir PR. Um hook `PreToolUse` em `.claude/settings.json` bloqueia o commit se a branch for `main` ou `master` — a regra aqui existe para ramificar antes de esbarrar no bloqueio.
- **Nada de dado físico nem de encontro.** Sem geolocalização, endereço ou dado físico de usuário em nenhuma entidade; sem entidade de "match" ou "encontro". O Calibre é um clube, não uma ferramenta de matching.
