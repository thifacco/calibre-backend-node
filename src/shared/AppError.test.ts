import { describe, expect, it } from "vitest";
import { AppError, conflict, notFound } from "./AppError.js";

describe("AppError", () => {
  it("carrega statusCode e mensagem", () => {
    const err = new AppError(418, "sou um bule");

    expect(err).toBeInstanceOf(Error);
    expect(err.statusCode).toBe(418);
    expect(err.message).toBe("sou um bule");
  });

  it("expõe helpers com o status correto", () => {
    expect(conflict("e-mail já cadastrado").statusCode).toBe(409);
    expect(notFound().statusCode).toBe(404);
  });
});
