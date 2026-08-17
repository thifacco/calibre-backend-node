import type { CollectionItemDoc } from "../models/CollectionItem.js";
import type { CommentDoc } from "../models/Comment.js";
import type { UserDoc } from "../models/User.js";
import type {
  CommentResponse,
  FeedItem,
  MovementType,
  UserResponse,
} from "../../shared/contracts.js";

/**
 * Tradução documento → contrato. Fica isolada aqui para o shape enviado ao
 * front-end não depender do formato interno do Mongo (_id, Date, campos
 * ausentes) e para a mudança de contrato ter um lugar só.
 *
 * Campos opcionais são omitidos quando não existem, em vez de virarem
 * `undefined` explícito — `exactOptionalPropertyTypes` está ligado.
 */
export function toFeedItem(doc: CollectionItemDoc): FeedItem {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    userName: doc.userName,
    brand: doc.brand,
    model: doc.model,
    ...(doc.referenceNumber != null ? { referenceNumber: doc.referenceNumber } : {}),
    ...(doc.movementType != null ? { movementType: doc.movementType as MovementType } : {}),
    ...(doc.acquiredYear != null ? { acquiredYear: doc.acquiredYear } : {}),
    ...(doc.acquiredContext != null ? { acquiredContext: doc.acquiredContext } : {}),
    memoryStory: doc.memoryStory,
    photos: doc.photos ?? [],
    reactionCounts: {
      touched: doc.reactionCounts?.touched ?? 0,
      curious: doc.reactionCounts?.curious ?? 0,
      sameStory: doc.reactionCounts?.sameStory ?? 0,
    },
    commentCount: doc.commentCount ?? 0,
    createdAt: doc.createdAt.toISOString(),
  };
}

export function toUserResponse(doc: UserDoc): UserResponse {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    createdAt: doc.createdAt.toISOString(),
  };
}

export function toCommentResponse(doc: CommentDoc): CommentResponse {
  return {
    id: doc._id.toString(),
    itemId: doc.itemId.toString(),
    userId: doc.userId.toString(),
    userName: doc.userName,
    content: doc.content,
    createdAt: doc.createdAt.toISOString(),
  };
}
