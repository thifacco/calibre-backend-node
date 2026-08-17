import { Types } from "mongoose";
import * as collectionItemRepository from "../repositories/collectionItemRepository.js";
import * as reactionRepository from "../repositories/reactionRepository.js";
import { badRequest, conflict, notFound } from "../../shared/AppError.js";
import type { ReactionCounts, ReactionType } from "../../shared/contracts.js";

export async function react(
  itemId: string,
  userId: string,
  type: ReactionType,
): Promise<ReactionCounts> {
  if (!Types.ObjectId.isValid(itemId)) throw badRequest("id de item inválido");

  const item = await collectionItemRepository.findById(itemId);
  if (item === null) throw notFound("Item não encontrado");

  const result = await reactionRepository.createWithCounter({
    itemId: item._id,
    userId: new Types.ObjectId(userId),
    type,
  });

  // O índice único recusou: já existe reação deste tipo, deste usuário, neste item.
  if (!result.created) throw conflict("Você já reagiu a este item com esse tipo");

  return result.reactionCounts;
}
