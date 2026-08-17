import mongoose, { type Types } from "mongoose";
import { ReactionModel } from "../models/Reaction.js";
import { CollectionItemModel } from "../models/CollectionItem.js";
import type { ReactionCounts, ReactionType } from "../../shared/contracts.js";

export interface CreateReactionData {
  itemId: Types.ObjectId;
  userId: Types.ObjectId;
  type: ReactionType;
}

/** Cada tipo de reação alimenta um contador desnormalizado do item. */
const COUNTER_FIELD: Record<ReactionType, string> = {
  TOUCHED: "reactionCounts.touched",
  CURIOUS: "reactionCounts.curious",
  SAME_STORY: "reactionCounts.sameStory",
};

export type CreateReactionResult =
  | { created: true; reactionCounts: ReactionCounts }
  | { created: false };

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;
}

/**
 * Grava a reação e incrementa o contador do item na mesma transação, para
 * `reactionCounts` nunca divergir da coleção `reactions`.
 *
 * Reação duplicada é barrada pelo índice único { itemId, userId, type } — não
 * por checagem prévia, que teria janela de corrida entre a leitura e a escrita.
 * Devolve `{ created: false }` nesse caso, para o service traduzir em 409.
 */
export async function createWithCounter(data: CreateReactionData): Promise<CreateReactionResult> {
  const session = await mongoose.startSession();

  try {
    const reactionCounts = await session.withTransaction(async () => {
      await ReactionModel.create([data], { session });

      const updated = await CollectionItemModel.findByIdAndUpdate(
        data.itemId,
        { $inc: { [COUNTER_FIELD[data.type]]: 1 } },
        { new: true, session, projection: { reactionCounts: 1 } },
      )
        .lean<{ reactionCounts: ReactionCounts } | null>()
        .exec();

      // Item sumiu entre a checagem do service e o incremento: aborta a
      // transação para não deixar reação órfã.
      if (updated === null) throw new Error(`Item ${data.itemId.toString()} não encontrado`);

      return updated.reactionCounts;
    });

    return { created: true, reactionCounts };
  } catch (err) {
    if (isDuplicateKeyError(err)) return { created: false };
    throw err;
  } finally {
    await session.endSession();
  }
}
