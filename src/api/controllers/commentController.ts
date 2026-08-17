import type { RequestHandler } from "express";
import { z } from "zod";
import * as commentService from "../services/commentService.js";
import { getUserId } from "../../middleware/auth.js";

const commentSchema = z.object({
  content: z.string().trim().min(1, "Comentário não pode ser vazio").max(2000),
});

const paramsSchema = z.object({ id: z.string().min(1) });

/** POST /api/items/:id/comments */
export const create: RequestHandler = async (req, res) => {
  const { id } = paramsSchema.parse(req.params);
  const { content } = commentSchema.parse(req.body);

  const comment = await commentService.comment(id, getUserId(req), content);

  res.status(201).json(comment);
};
