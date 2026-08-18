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

Preencha o `.env` com a connection string do MongoDB e um `JWT_SECRET` aleatório. O servidor valida o ambiente no boot e recusa subir com variável faltando, listando o que falta.

### O MongoDB precisa ser replica set

As rotas de reação e comentário gravam o detalhe e incrementam o contador na mesma transação, e transação exige replica set. O Atlas já é um. Um `mongod` local instalado por padrão é standalone e faz essas duas rotas falharem — as outras cinco funcionam.

Para converter uma instalação local em replica set de nó único, acrescente ao `mongod.cfg`:

```yaml
replication:
  replSetName: rs0
```

Reinicie o serviço e inicialize o conjunto uma única vez. O host precisa ser explícito: com `bindIp: 127.0.0.1`, o padrão do `rs.initiate()` usa o hostname da máquina e o nó não se alcança.

```javascript
rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "127.0.0.1:27017" }] })
```

Enquanto o conjunto não for inicializado, o mongod sobe e escuta na porta mas não elege primário — e nenhum cliente consegue conectar, nem o Compass.

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

Os testes rodam sem banco: cobrem os services com o repository mockado e a camada de auth e validação das rotas. Os caminhos felizes foram verificados manualmente contra um MongoDB local — não existe teste automatizado de integração com banco.

## Documentação

- [ARQUITETURA.md](ARQUITETURA.md) — camadas, contrato de API, autenticação e modelagem de dados
- [CLAUDE.md](CLAUDE.md) — guia para desenvolvimento assistido por IA neste repositório

## Débitos técnicos conhecidos

Aceitos conscientemente nesta fase, documentados para não serem redescobertos como surpresa:

- **Sem verificação de e-mail no cadastro.** O usuário é criado e já pode logar.
- **Sem fluxo de recuperação de senha.** Fica para uma fase futura, quando um provedor de e-mail voltar a fazer parte do escopo.
- **Sem rate limiting nas rotas de reação e comentário.** Risco conhecido de spam.
