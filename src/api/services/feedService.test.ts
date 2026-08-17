import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CollectionItemDoc } from "../models/CollectionItem.js";
import { decodeCursor, encodeCursor } from "../../shared/cursor.js";

vi.mock("../repositories/collectionItemRepository.js", () => ({
  findFeedPage: vi.fn(),
  findByUserId: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
}));

import * as collectionItemRepository from "../repositories/collectionItemRepository.js";
import { FEED_PAGE_SIZE, getFeed } from "./feedService.js";

const repo = vi.mocked(collectionItemRepository);

function itemDoc(index: number): CollectionItemDoc {
  return {
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(),
    userName: `Colecionador ${index}`,
    brand: "Seiko",
    model: "SKX007",
    memoryStory: "Herança do meu avô.",
    photos: [],
    reactionCounts: { touched: 1, curious: 0, sameStory: 2 },
    commentCount: 3,
    createdAt: new Date(Date.now() - index * 1000),
  } as unknown as CollectionItemDoc;
}

function pageOf(size: number): CollectionItemDoc[] {
  return Array.from({ length: size }, (_, i) => itemDoc(i));
}

beforeEach(() => {
  repo.findFeedPage.mockResolvedValue([]);
});

describe("feedService.getFeed", () => {
  it("pede uma linha a mais que a página, para saber se há próxima", async () => {
    await getFeed({});

    expect(repo.findFeedPage).toHaveBeenCalledWith(
      expect.objectContaining({ limit: FEED_PAGE_SIZE + 1 }),
    );
  });

  it("devolve nextCursor null quando a última página não enche", async () => {
    repo.findFeedPage.mockResolvedValue(pageOf(FEED_PAGE_SIZE - 1));

    const feed = await getFeed({});

    expect(feed.items).toHaveLength(FEED_PAGE_SIZE - 1);
    expect(feed.nextCursor).toBeNull();
  });

  it("corta a linha extra e devolve cursor apontando para o último item entregue", async () => {
    const docs = pageOf(FEED_PAGE_SIZE + 1);
    repo.findFeedPage.mockResolvedValue(docs);

    const feed = await getFeed({});

    expect(feed.items).toHaveLength(FEED_PAGE_SIZE);
    expect(feed.nextCursor).not.toBeNull();

    // O cursor tem que apontar para o último item DEVOLVIDO, não para a
    // sonda — senão a próxima página pularia um registro.
    const ultimoEntregue = docs[FEED_PAGE_SIZE - 1]!;
    expect(decodeCursor(feed.nextCursor!)?.id.toString()).toBe(ultimoEntregue._id.toString());
  });

  it("repassa o cursor decodificado para o repository", async () => {
    const createdAt = new Date("2026-02-01T10:00:00.000Z");
    const id = new Types.ObjectId();

    await getFeed({ cursor: encodeCursor(createdAt, id) });

    const arg = repo.findFeedPage.mock.calls[0]?.[0];
    expect(arg?.cursor?.id.toString()).toBe(id.toString());
    expect(arg?.cursor?.createdAt.toISOString()).toBe(createdAt.toISOString());
  });

  it("rejeita cursor inválido com 400 em vez de ignorar", async () => {
    await expect(getFeed({ cursor: "lixo!!" })).rejects.toMatchObject({ statusCode: 400 });
    expect(repo.findFeedPage).not.toHaveBeenCalled();
  });

  it("trata q vazio ou só espaços como ausência de filtro", async () => {
    await getFeed({ q: "   " });

    expect(repo.findFeedPage).toHaveBeenCalledWith(expect.objectContaining({ q: null }));
  });

  it("mapeia o documento para o shape do contrato, com userName desnormalizado", async () => {
    repo.findFeedPage.mockResolvedValue(pageOf(1));

    const [item] = (await getFeed({})).items;

    expect(item).toMatchObject({
      userName: "Colecionador 0",
      brand: "Seiko",
      reactionCounts: { touched: 1, curious: 0, sameStory: 2 },
      commentCount: 3,
    });
    expect(typeof item?.id).toBe("string");
    expect(typeof item?.createdAt).toBe("string");
    expect(item).not.toHaveProperty("_id");
  });
});
