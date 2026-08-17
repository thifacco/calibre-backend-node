import { Router } from "express";
import * as feedController from "../controllers/feedController.js";

export const feedRouter = Router();

// Público por decisão de produto: o feed é a vitrine do clube.
feedRouter.get("/", feedController.list);
