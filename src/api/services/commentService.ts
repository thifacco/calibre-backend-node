import { Types } from "mongoose";
import * as collectionItemRepository from "../repositories/collectionItemRepository.js";
import * as commentRepository from "../repositories/commentRepository.js";
import * as userRepository from "../repositories/userRepository.js";
import { badRequest, notFound, unauthorized } from "../../shared/AppError.js";
import { toCommentResponse } from "./mappers.js";
import type { CommentResponse } from "../../shared/contracts.js";

export async function comment(
  itemId: string,
  userId: string,
  content: string,
): Promise<CommentResponse> {
  if (!Types.ObjectId.isValid(itemId)) throw badRequest("id de item inválido");

  const item = await collectionItemRepository.findById(itemId);
  if (item === null) throw notFound("Item não encontrado");

  const user = await userRepository.findById(userId);
  if (user === null) throw unauthorized("Usuário do token não encontrado");

  const created = await commentRepository.createWithCounter({
    itemId: item._id,
    userId: user._id,
    userName: user.name, // desnormalizado, igual ao item
    content,
  });

  return toCommentResponse(created);
}
