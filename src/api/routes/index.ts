import { Router } from "express";
import { usersRouter } from "./users.js";
import { sessionRouter } from "./session.js";
import { feedRouter } from "./feed.js";
import { itemsRouter } from "./items.js";

/**
 * Router raiz montado em /api. A tabela do contrato está em ARQUITETURA.md —
 * mudar rota aqui é breaking change para o front-end.
 */
export const apiRouter = Router();

apiRouter.use("/users", usersRouter);
apiRouter.use("/session", sessionRouter);
apiRouter.use("/feed", feedRouter);
apiRouter.use("/items", itemsRouter);
