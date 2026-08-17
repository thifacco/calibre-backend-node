# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Estado atual

Repositório greenfield: só há documentação. Não existe `package.json`, tooling ou código-fonte — não presuma que há algo para rodar.

Alvo: TypeScript + Node.js + Express + MongoDB Atlas, servidor local na porta 4000, sem deploy nesta fase. Quando o scaffold existir, documentar aqui os comandos reais de dev, build e teste (incluindo como rodar um teste isolado).

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
- **Nada de dado físico nem de encontro.** Sem geolocalização, endereço ou dado físico de usuário em nenhuma entidade; sem entidade de "match" ou "encontro". O Calibre é um clube, não uma ferramenta de matching.
