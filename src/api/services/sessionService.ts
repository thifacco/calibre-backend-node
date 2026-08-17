import bcrypt from "bcryptjs";
import * as userRepository from "../repositories/userRepository.js";
import { signToken } from "../../middleware/auth.js";
import { unauthorized } from "../../shared/AppError.js";
import type { SessionResponse } from "../../shared/contracts.js";

export interface LoginInput {
  email: string;
  password: string;
}

export async function login(input: LoginInput): Promise<SessionResponse> {
  const user = await userRepository.findByEmail(input.email);

  // Mesma mensagem para e-mail inexistente e senha errada: dizer qual dos dois
  // falhou entrega quais e-mails estão cadastrados.
  if (user === null) throw unauthorized("E-mail ou senha inválidos");

  const senhaConfere = await bcrypt.compare(input.password, user.passwordHash);
  if (!senhaConfere) throw unauthorized("E-mail ou senha inválidos");

  const userId = user._id.toString();

  return {
    token: signToken(userId),
    userId,
    name: user.name,
  };
}
