# calibre-backend-node

Back-end do **Calibre**, um clube de colecionadores de relógios onde cada item da coleção carrega uma história de memória emocional, não apenas dados técnicos.

O Calibre não é uma ferramenta de matching ou encontro — a interação entre membros é social (comentar, reagir), nunca logística.

O front-end vive em repositório e deploy separados e consome o contrato de API definido em [ARQUITETURA.md](ARQUITETURA.md).

## Stack

| Camada | Tecnologia |
|---|---|
| Runtime / linguagem | TypeScript + Node.js |
| Framework | Express |
| Banco de dados | MongoDB Atlas |
| Execução | Localhost, porta 4000 — sem deploy nesta fase |

O MongoDB Atlas é remoto, então o back-end roda local sem precisar de banco instalado na máquina.

## Como rodar

Requer Node 22 ou superior.

```bash
npm install
cp .env.example .env
```

Preencha o `.env` com a connection string do Atlas e um `JWT_SECRET` aleatório. O servidor valida o ambiente no boot e recusa subir com variável faltando, listando o que falta.

```bash
npm run dev
```

Sobe em `http://localhost:4000` com reload automático. `GET /health` confirma que está no ar.

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor local com reload |
| `npm run build` | compila para `dist/` |
| `npm start` | roda o build |
| `npm run typecheck` | checagem de tipos sem emitir |
| `npm test` | suíte completa |
| `npm run test:watch` | testes em watch |
| `npx vitest run src/app.test.ts` | um arquivo de teste isolado |

Os testes não tocam o Atlas — o ambiente de teste é injetado pelo `vitest.config.ts` e o acesso a banco entra mockado no nível de repository.

## Estado do repositório

As sete rotas do contrato estão implementadas — cadastro, login, feed paginado por cursor, criação e listagem de itens, reações e comentários.

Os testes rodam sem banco: cobrem os services com o repository mockado e a camada de auth e validação das rotas. Os caminhos felizes ainda não foram exercitados contra um MongoDB real.

## Documentação

- [ARQUITETURA.md](ARQUITETURA.md) — camadas, contrato de API, autenticação e modelagem de dados
- [CLAUDE.md](CLAUDE.md) — guia para desenvolvimento assistido por IA neste repositório

## Débitos técnicos conhecidos

Aceitos conscientemente nesta fase, documentados para não serem redescobertos como surpresa:

- **Sem verificação de e-mail no cadastro.** O usuário é criado e já pode logar.
- **Sem fluxo de recuperação de senha.** Fica para uma fase futura, quando um provedor de e-mail voltar a fazer parte do escopo.
- **Sem rate limiting nas rotas de reação e comentário.** Risco conhecido de spam.
