import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CollectionItemDoc } from "../models/CollectionItem.js";

vi.mock("../repositories/collectionItemRepository.js", () => ({
  findById: vi.fn(),
  findFeedPage: vi.fn(),
  findByUserId: vi.fn(),
  create: vi.fn(),
}));

vi.mock("../repositories/reactionRepository.js", () => ({
  createWithCounter: vi.fn(),
}));

import * as collectionItemRepository from "../repositories/collectionItemRepository.js";
import * as reactionRepository from "../repositories/reactionRepository.js";
import { react } from "./reactionService.js";

const itemRepo = vi.mocked(collectionItemRepository);
const reactionRepo = vi.mocked(reactionRepository);

const ITEM_ID = new Types.ObjectId();
const USER_ID = new Types.ObjectId();

beforeEach(() => {
  itemRepo.findById.mockResolvedValue({ _id: ITEM_ID } as CollectionItemDoc);
  reactionRepo.createWithCounter.mockResolvedValue({
    created: true,
    reactionCounts: { touched: 1, curious: 0, sameStory: 0 },
  });
});

describe("reactionService.react", () => {
  it("devolve os contadores já atualizados", async () => {
    const counts = await react(ITEM_ID.toString(), USER_ID.toString(), "TOUCHED");

    expect(counts).toEqual({ touched: 1, curious: 0, sameStory: 0 });
  });

  it("traduz recusa do índice único em 409", async () => {
    reactionRepo.createWithCounter.mockResolvedValue({ created: false });

    await expect(
      react(ITEM_ID.toString(), USER_ID.toString(), "TOUCHED"),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("devolve 404 quando o item não existe, sem tentar gravar", async () => {
    itemRepo.findById.mockResolvedValue(null);

    await expect(
      react(ITEM_ID.toString(), USER_ID.toString(), "CURIOUS"),
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(reactionRepo.createWithCounter).not.toHaveBeenCalled();
  });

  it("rejeita id malformado com 400 antes de ir ao banco", async () => {
    await expect(react("nao-e-objectid", USER_ID.toString(), "TOUCHED")).rejects.toMatchObject({
      statusCode: 400,
    });

    expect(itemRepo.findById).not.toHaveBeenCalled();
  });

  it("repassa o tipo da reação para o repository", async () => {
    await react(ITEM_ID.toString(), USER_ID.toString(), "SAME_STORY");

    expect(reactionRepo.createWithCounter).toHaveBeenCalledWith(
      expect.objectContaining({ type: "SAME_STORY" }),
    );
  });
});
