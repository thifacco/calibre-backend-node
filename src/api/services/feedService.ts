import * as collectionItemRepository from "../repositories/collectionItemRepository.js";
import { decodeCursor, encodeCursor } from "../../shared/cursor.js";
import { badRequest } from "../../shared/AppError.js";
import { toFeedItem } from "./mappers.js";
import type { FeedResponse } from "../../shared/contracts.js";

export const FEED_PAGE_SIZE = 20;

export interface FeedQuery {
  cursor?: string | undefined;
  q?: string | undefined;
}

export async function getFeed(query: FeedQuery): Promise<FeedResponse> {
  const cursor = query.cursor ? decodeCursor(query.cursor) : null;

  if (query.cursor && cursor === null) {
    throw badRequest("Cursor inválido");
  }

  const term = query.q?.trim();

  // Busca uma linha a mais que a página: se ela vier, sobrou conteúdo e há
  // próxima página. Evita uma segunda query só para descobrir isso.
  const docs = await collectionItemRepository.findFeedPage({
    limit: FEED_PAGE_SIZE + 1,
    cursor,
    q: term && term.length > 0 ? term : null,
  });

  const temProximaPagina = docs.length > FEED_PAGE_SIZE;
  const page = temProximaPagina ? docs.slice(0, FEED_PAGE_SIZE) : docs;
  const last = page.at(-1);

  return {
    items: page.map(toFeedItem),
    nextCursor: temProximaPagina && last ? encodeCursor(last.createdAt, last._id) : null,
  };
}
