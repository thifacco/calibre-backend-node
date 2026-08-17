import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import { createApp } from "../../app.js";

/**
 * Verifica o wiring das rotas: auth e validação rodam ANTES de qualquer
 * acesso ao banco, então estes casos não precisam de Mongo. Os caminhos
 * felizes, que chegam ao repository, ficam para teste de integração com
 * banco — aqui só se garante que nada passa direto pelo middleware.
 */
let server: Server;
let baseUrl: string;

const tokenValido = jwt.sign({ sub: "652f1a2b3c4d5e6f7a8b9c0d" }, process.env.JWT_SECRET!);

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server = createApp().listen(0, () => {
      const address = server.address();
      if (address === null || typeof address === "string") throw new Error("Sem endereço TCP");
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

function post(path: string, body: unknown, token?: string) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe("rotas autenticadas", () => {
  it.each([
    ["POST", "/api/items"],
    ["POST", "/api/items/652f1a2b3c4d5e6f7a8b9c0d/reactions"],
    ["POST", "/api/items/652f1a2b3c4d5e6f7a8b9c0d/comments"],
  ])("%s %s exige token", async (_method, path) => {
    const res = await post(path, {});

    expect(res.status).toBe(401);
  });

  it("recusa token assinado com outro segredo", async () => {
    const forjado = jwt.sign({ sub: "652f1a2b3c4d5e6f7a8b9c0d" }, "outro-segredo-qualquer");

    const res = await post("/api/items", {}, forjado);

    expect(res.status).toBe(401);
  });

  it("recusa token expirado", async () => {
    const expirado = jwt.sign({ sub: "652f1a2b3c4d5e6f7a8b9c0d" }, process.env.JWT_SECRET!, {
      expiresIn: "-1h",
    });

    const res = await post("/api/items", {}, expirado);

    expect(res.status).toBe(401);
  });

  it("com token válido, passa da auth e chega na validação de corpo", async () => {
    const res = await post("/api/items", { brand: "" }, tokenValido);

    // 400, não 401: o middleware liberou e o zod barrou.
    expect(res.status).toBe(400);
  });
});

describe("validação de entrada", () => {
  it("POST /api/users devolve 400 com a lista de campos inválidos", async () => {
    const res = await post("/api/users", { name: "", email: "nao-e-email", password: "123" });

    expect(res.status).toBe(400);

    const body = (await res.json()) as { error: { details: { field: string }[] } };
    const campos = body.error.details.map((d) => d.field);

    expect(campos).toEqual(expect.arrayContaining(["name", "email", "password"]));
  });

  it("POST /api/session devolve 400 sem credenciais", async () => {
    const res = await post("/api/session", {});

    expect(res.status).toBe(400);
  });

  it("POST /api/items rejeita movementType fora do enum", async () => {
    const res = await post(
      "/api/items",
      { brand: "Seiko", model: "SKX007", memoryStory: "Do meu avô.", movementType: "SOLAR" },
      tokenValido,
    );

    expect(res.status).toBe(400);
  });

  it("reação com tipo inválido é barrada antes de chegar ao banco", async () => {
    const res = await post(
      "/api/items/652f1a2b3c4d5e6f7a8b9c0d/reactions",
      { type: "LOVED" },
      tokenValido,
    );

    expect(res.status).toBe(400);
  });

  it("GET /api/feed devolve 400 para cursor corrompido", async () => {
    const res = await fetch(`${baseUrl}/api/feed?cursor=${encodeURIComponent("lixo!!")}`);

    expect(res.status).toBe(400);
  });

  it("GET /api/items exige token e depois userId", async () => {
    const semToken = await fetch(`${baseUrl}/api/items`);
    expect(semToken.status).toBe(401);

    const semUserId = await fetch(`${baseUrl}/api/items`, {
      headers: { authorization: `Bearer ${tokenValido}` },
    });
    expect(semUserId.status).toBe(400);
  });
});
