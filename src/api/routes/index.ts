import { Router } from "express";

/**
 * Router raiz montado em /api. Cada recurso do contrato ganha um sub-router
 * aqui — users, session, feed, items. Ver a tabela em ARQUITETURA.md.
 */
export const apiRouter = Router();

// TODO: apiRouter.use("/users", usersRouter);
// TODO: apiRouter.use("/session", sessionRouter);
// TODO: apiRouter.use("/feed", feedRouter);
// TODO: apiRouter.use("/items", itemsRouter);
