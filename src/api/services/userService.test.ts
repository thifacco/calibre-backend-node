import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../../shared/AppError.js";
import type { UserDoc } from "../models/User.js";

vi.mock("../repositories/userRepository.js", () => ({
  existsByEmail: vi.fn(),
  create: vi.fn(),
  findByEmail: vi.fn(),
  findById: vi.fn(),
}));

import * as userRepository from "../repositories/userRepository.js";
import { register } from "./userService.js";

const repo = vi.mocked(userRepository);

function userDoc(overrides: Partial<UserDoc> = {}): UserDoc {
  return {
    _id: new Types.ObjectId(),
    name: "Tiago",
    email: "tiago@example.com",
    passwordHash: "hash",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  } as UserDoc;
}

beforeEach(() => {
  repo.existsByEmail.mockResolvedValue(false);
  repo.create.mockImplementation(async (data) => userDoc(data));
});

describe("userService.register", () => {
  it("salva o hash, nunca a senha em texto", async () => {
    await register({ name: "Tiago", email: "tiago@example.com", password: "senha-secreta" });

    const salvo = repo.create.mock.calls[0]?.[0];

    expect(salvo?.passwordHash).toBeDefined();
    expect(salvo?.passwordHash).not.toBe("senha-secreta");
    await expect(bcrypt.compare("senha-secreta", salvo!.passwordHash)).resolves.toBe(true);
  });

  it("normaliza e-mail para minúsculas e apara o nome", async () => {
    await register({ name: "  Tiago  ", email: "TIAGO@Example.COM", password: "senha-secreta" });

    const salvo = repo.create.mock.calls[0]?.[0];

    expect(salvo?.email).toBe("tiago@example.com");
    expect(salvo?.name).toBe("Tiago");
  });

  it("recusa e-mail já cadastrado com 409", async () => {
    repo.existsByEmail.mockResolvedValue(true);

    await expect(
      register({ name: "Tiago", email: "tiago@example.com", password: "senha-secreta" }),
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(repo.create).not.toHaveBeenCalled();
  });

  it("não devolve passwordHash na resposta", async () => {
    const response = await register({
      name: "Tiago",
      email: "tiago@example.com",
      password: "senha-secreta",
    });

    expect(response).not.toHaveProperty("passwordHash");
    expect(response).toMatchObject({ name: "Tiago", email: "tiago@example.com" });
  });

  it("erro de conflito é AppError, para o errorHandler traduzir", async () => {
    repo.existsByEmail.mockResolvedValue(true);

    await expect(
      register({ name: "Tiago", email: "tiago@example.com", password: "senha-secreta" }),
    ).rejects.toBeInstanceOf(AppError);
  });
});
