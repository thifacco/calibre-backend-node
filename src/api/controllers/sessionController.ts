import type { RequestHandler } from "express";
import { z } from "zod";
import * as sessionService from "../services/sessionService.js";

const loginSchema = z.object({
  email: z.email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

/** POST /api/session — login. Público. Retorna { token, userId, name }. */
export const create: RequestHandler = async (req, res) => {
  const input = loginSchema.parse(req.body);
  const session = await sessionService.login(input);

  res.status(200).json(session);
};
