import bcrypt from "bcryptjs";
import * as userRepository from "../repositories/userRepository.js";
import { conflict } from "../../shared/AppError.js";
import { toUserResponse } from "./mappers.js";
import type { UserResponse } from "../../shared/contracts.js";

const SALT_ROUNDS = 10;

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

/**
 * A senha vem definida pelo próprio usuário no cadastro — sem envio de e-mail
 * nesta fase. Só o hash é persistido.
 */
export async function register(input: RegisterInput): Promise<UserResponse> {
  const email = input.email.toLowerCase().trim();

  // Checagem amigável; o índice único em users.email é a garantia real e
  // ainda pode disparar 11000 numa corrida — o errorHandler traduz para 409.
  if (await userRepository.existsByEmail(email)) {
    throw conflict("E-mail já cadastrado");
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const created = await userRepository.create({
    name: input.name.trim(),
    email,
    passwordHash,
  });

  return toUserResponse(created);
}
