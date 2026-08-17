import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserDoc } from "../models/User.js";

vi.mock("../repositories/userRepository.js", () => ({
  findByEmail: vi.fn(),
  findById: vi.fn(),
  existsByEmail: vi.fn(),
  create: vi.fn(),
}));

import * as userRepository from "../repositories/userRepository.js";
import { login } from "./sessionService.js";

const repo = vi.mocked(userRepository);

const SENHA = "senha-secreta";
const USER_ID = new Types.ObjectId();

let hash: string;

beforeEach(async () => {
  hash ??= await bcrypt.hash(SENHA, 10);

  repo.findByEmail.mockResolvedValue({
    _id: USER_ID,
    name: "Tiago",
    email: "tiago@example.com",
    passwordHash: hash,
    createdAt: new Date(),
  } as UserDoc);
});

describe("sessionService.login", () => {
  it("devolve token, userId e name no formato do contrato", async () => {
    const session = await login({ email: "tiago@example.com", password: SENHA });

    expect(Object.keys(session).sort()).toEqual(["name", "token", "userId"]);
    expect(session.userId).toBe(USER_ID.toString());
    expect(session.name).toBe("Tiago");
  });

  it("emite um JWT com o userId no sub", async () => {
    const { token } = await login({ email: "tiago@example.com", password: SENHA });

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string };

    expect(payload.sub).toBe(USER_ID.toString());
  });

  it("recusa senha errada com 401", async () => {
    await expect(
      login({ email: "tiago@example.com", password: "senha-errada" }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("usa a mesma mensagem para e-mail inexistente e senha errada", async () => {
    const senhaErrada = await login({
      email: "tiago@example.com",
      password: "senha-errada",
    }).catch((err: Error) => err.message);

    repo.findByEmail.mockResolvedValue(null);

    const emailInexistente = await login({
      email: "ninguem@example.com",
      password: SENHA,
    }).catch((err: Error) => err.message);

    // Mensagens diferentes revelariam quais e-mails estão cadastrados.
    expect(senhaErrada).toBe(emailInexistente);
  });
});
