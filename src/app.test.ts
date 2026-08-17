import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./app.js";

/**
 * Sobe o app numa porta efêmera. Não abre conexão com o Mongo — createApp
 * é justamente o ponto de corte que permite testar HTTP sem banco.
 */
let server: Server;
let baseUrl: string;

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server = createApp().listen(0, () => {
      const address = server.address();
      if (address === null || typeof address === "string") {
        throw new Error("Esperava um endereço TCP");
      }
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

describe("app", () => {
  it("responde no /health", async () => {
    const res = await fetch(`${baseUrl}/health`);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ status: "ok" });
  });

  it("devolve 404 com shape de erro em rota inexistente", async () => {
    const res = await fetch(`${baseUrl}/api/nao-existe`);

    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { message: string } };
    expect(body.error.message).toContain("Rota não encontrada");
  });
});
