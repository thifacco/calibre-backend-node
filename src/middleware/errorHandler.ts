import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../shared/AppError.js";
import { env } from "../config/env.js";

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: { message: `Rota não encontrada: ${req.method} ${req.path}` } });
};

/**
 * Tradutor único de erro para resposta HTTP. O Express 5 encaminha rejeições
 * de handlers async para cá automaticamente — não precisa de wrapper.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: { message: err.message } });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        message: "Dados inválidos",
        details: err.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
    return;
  }

  // Violação de índice único — ex: e-mail já cadastrado, reação duplicada.
  if (typeof err === "object" && err !== null && (err as { code?: number }).code === 11000) {
    res.status(409).json({ error: { message: "Registro já existe" } });
    return;
  }

  console.error("Erro não tratado:", err);

  res.status(500).json({
    error: {
      message: "Erro interno",
      ...(env.NODE_ENV === "development" && err instanceof Error ? { debug: err.message } : {}),
    },
  });
};
