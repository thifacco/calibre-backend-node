import type { RequestHandler } from "express";
import { z } from "zod";
import * as userService from "../services/userService.js";

const registerSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(120),
  email: z.email("E-mail inválido"),
  password: z.string().min(8, "Senha precisa ter ao menos 8 caracteres").max(200),
});

/** POST /api/users — cadastro. Público. */
export const create: RequestHandler = async (req, res) => {
  const input = registerSchema.parse(req.body);
  const user = await userService.register(input);

  res.status(201).json(user);
};
