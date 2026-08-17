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

## Estado do repositório

Ainda não há código nem tooling — o repositório contém apenas a documentação. O scaffold (`package.json`, `tsconfig.json`, estrutura `/api`, conexão com o Atlas) é o próximo passo.

Comandos de desenvolvimento serão documentados aqui quando o `package.json` existir.

## Documentação

- [ARQUITETURA.md](ARQUITETURA.md) — camadas, contrato de API, autenticação e modelagem de dados
- [CLAUDE.md](CLAUDE.md) — guia para desenvolvimento assistido por IA neste repositório

## Débitos técnicos conhecidos

Aceitos conscientemente nesta fase, documentados para não serem redescobertos como surpresa:

- **Sem verificação de e-mail no cadastro.** O usuário é criado e já pode logar.
- **Sem fluxo de recuperação de senha.** Fica para uma fase futura, quando um provedor de e-mail voltar a fazer parte do escopo.
- **Sem rate limiting nas rotas de reação e comentário.** Risco conhecido de spam.
