import { Types } from "mongoose";
import * as collectionItemRepository from "../repositories/collectionItemRepository.js";
import * as userRepository from "../repositories/userRepository.js";
import { badRequest, unauthorized } from "../../shared/AppError.js";
import { toFeedItem } from "./mappers.js";
import type { FeedItem, NewCollectionItemInput } from "../../shared/contracts.js";

/**
 * Cria o item já com o userName copiado do usuário — é essa cópia que permite
 * o feed renderizar sem join.
 */
export async function createItem(
  userId: string,
  input: NewCollectionItemInput,
): Promise<FeedItem> {
  const user = await userRepository.findById(userId);

  // Token válido cujo usuário não existe mais: nada a copiar, não dá para criar.
  if (user === null) throw unauthorized("Usuário do token não encontrado");

  const created = await collectionItemRepository.create({
    userId: user._id,
    userName: user.name,
    brand: input.brand,
    model: input.model,
    ...(input.referenceNumber != null ? { referenceNumber: input.referenceNumber } : {}),
    ...(input.movementType != null ? { movementType: input.movementType } : {}),
    ...(input.acquiredYear != null ? { acquiredYear: input.acquiredYear } : {}),
    ...(input.acquiredContext != null ? { acquiredContext: input.acquiredContext } : {}),
    memoryStory: input.memoryStory,
    photos: input.photos ?? [],
  });

  return toFeedItem(created);
}

export async function listByUser(userId: string): Promise<FeedItem[]> {
  if (!Types.ObjectId.isValid(userId)) throw badRequest("userId inválido");

  const docs = await collectionItemRepository.findByUserId(userId);
  return docs.map(toFeedItem);
}
