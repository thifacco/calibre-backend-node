import mongoose, { type Types } from "mongoose";
import { CommentModel, type CommentDoc } from "../models/Comment.js";
import { CollectionItemModel } from "../models/CollectionItem.js";

export interface CreateCommentData {
  itemId: Types.ObjectId;
  userId: Types.ObjectId;
  userName: string;
  content: string;
}

/**
 * Grava o comentário e incrementa `commentCount` na mesma transação — mesma
 * regra dos contadores de reação (ver ARQUITETURA.md).
 */
export async function createWithCounter(data: CreateCommentData): Promise<CommentDoc> {
  const session = await mongoose.startSession();

  try {
    return await session.withTransaction(async () => {
      const [doc] = await CommentModel.create([data], { session });
      if (doc === undefined) throw new Error("Falha ao criar comentário");

      const updated = await CollectionItemModel.updateOne(
        { _id: data.itemId },
        { $inc: { commentCount: 1 } },
        { session },
      ).exec();

      if (updated.matchedCount === 0) {
        throw new Error(`Item ${data.itemId.toString()} não encontrado`);
      }

      return doc.toObject<CommentDoc>();
    });
  } finally {
    await session.endSession();
  }
}
