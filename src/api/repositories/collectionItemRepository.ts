import { Types, type FilterQuery } from "mongoose";
import { CollectionItemModel, type CollectionItemDoc } from "../models/CollectionItem.js";
import type { FeedCursor } from "../../shared/cursor.js";
import type { MovementType } from "../../shared/contracts.js";

export interface CreateCollectionItemData {
  userId: Types.ObjectId;
  userName: string;
  brand: string;
  model: string;
  referenceNumber?: string;
  movementType?: MovementType;
  acquiredYear?: number;
  acquiredContext?: string;
  memoryStory: string;
  photos: string[];
}

export interface FeedPageQuery {
  limit: number;
  cursor: FeedCursor | null;
  q: string | null;
}

/** Neutraliza os metacaracteres do termo de busca vindo da query string. */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function create(data: CreateCollectionItemData): Promise<CollectionItemDoc> {
  const created = await CollectionItemModel.create(data);
  return created.toObject<CollectionItemDoc>();
}

export async function findById(id: string): Promise<CollectionItemDoc | null> {
  if (!Types.ObjectId.isValid(id)) return null;
  return CollectionItemModel.findById(id).lean<CollectionItemDoc | null>().exec();
}

/**
 * Página do feed, mais recentes primeiro. Ordena por createdAt desc com _id
 * como desempate — a mesma ordem assumida pelo cursor.
 */
export async function findFeedPage({
  limit,
  cursor,
  q,
}: FeedPageQuery): Promise<CollectionItemDoc[]> {
  const conditions: FilterQuery<CollectionItemDoc>[] = [];

  if (q) {
    const term = new RegExp(escapeRegex(q), "i");
    conditions.push({ $or: [{ brand: term }, { model: term }] });
  }

  if (cursor) {
    conditions.push({
      $or: [
        { createdAt: { $lt: cursor.createdAt } },
        { createdAt: cursor.createdAt, _id: { $lt: cursor.id } },
      ],
    });
  }

  // $and explícito: q e cursor usam $or cada um, e um sobrescreveria o outro
  // se fossem para a raiz do filtro.
  const filter: FilterQuery<CollectionItemDoc> = conditions.length > 0 ? { $and: conditions } : {};

  return CollectionItemModel.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit)
    .lean<CollectionItemDoc[]>()
    .exec();
}

export async function findByUserId(userId: string): Promise<CollectionItemDoc[]> {
  if (!Types.ObjectId.isValid(userId)) return [];

  return CollectionItemModel.find({ userId: new Types.ObjectId(userId) })
    .sort({ createdAt: -1, _id: -1 })
    .lean<CollectionItemDoc[]>()
    .exec();
}
