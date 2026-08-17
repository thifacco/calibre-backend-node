import express from "express";
import { apiRouter } from "./api/routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

/**
 * Monta o app sem subir servidor nem abrir conexão — assim os testes de
 * integração podem importar isto direto.
 */
export function createApp() {
  const app = express();

  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
