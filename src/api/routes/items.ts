import { Router } from "express";
import * as itemController from "../controllers/itemController.js";
import * as reactionController from "../controllers/reactionController.js";
import * as commentController from "../controllers/commentController.js";
import { requireAuth } from "../../middleware/auth.js";

export const itemsRouter = Router();

// Todas as rotas de item exigem Bearer token.
itemsRouter.use(requireAuth);

itemsRouter.post("/", itemController.create);
itemsRouter.get("/", itemController.listByUser);
itemsRouter.post("/:id/reactions", reactionController.create);
itemsRouter.post("/:id/comments", commentController.create);
