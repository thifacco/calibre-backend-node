import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { unauthorized } from "../shared/AppError.js";

export interface TokenPayload {
  sub: string; // userId
}

/**
 * Valida `Authorization: Bearer <token>` e expõe o userId em `req.auth`.
 * Aplicar nas rotas de /api/items — feed, cadastro e login são públicos.
 */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    throw unauthorized("Token ausente");
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    req.auth = { userId: payload.sub };
    next();
  } catch {
    throw unauthorized("Token inválido ou expirado");
  }
};

export function signToken(userId: string): string {
  // JWT_EXPIRES_IN chega como string do .env; o tipo do jsonwebtoken é um
  // template literal ("7d", "1h", ...) que a validação de env não reproduz.
  const expiresIn = env.JWT_EXPIRES_IN as NonNullable<jwt.SignOptions["expiresIn"]>;

  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn });
}
