import { Types } from "mongoose";
import { describe, expect, it } from "vitest";
import { decodeCursor, encodeCursor } from "./cursor.js";

describe("cursor do feed", () => {
  it("faz roundtrip preservando createdAt e id", () => {
    const createdAt = new Date("2026-03-14T15:09:26.535Z");
    const id = new Types.ObjectId();

    const decoded = decodeCursor(encodeCursor(createdAt, id));

    expect(decoded).not.toBeNull();
    expect(decoded?.createdAt.toISOString()).toBe(createdAt.toISOString());
    expect(decoded?.id.toString()).toBe(id.toString());
  });

  it("não vaza o formato interno na string", () => {
    const cursor = encodeCursor(new Date(), new Types.ObjectId());

    expect(cursor).not.toContain("|");
    expect(cursor).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("rejeita cursor corrompido em vez de devolver data inválida", () => {
    expect(decodeCursor("nao-e-base64-valido!!")).toBeNull();
    expect(decodeCursor(Buffer.from("sem-separador").toString("base64url"))).toBeNull();
    expect(decodeCursor(Buffer.from("data-ruim|abc").toString("base64url"))).toBeNull();
  });

  it("rejeita id que não é ObjectId", () => {
    const raw = Buffer.from("2026-03-14T15:09:26.535Z|nao-e-objectid").toString("base64url");

    expect(decodeCursor(raw)).toBeNull();
  });
});
