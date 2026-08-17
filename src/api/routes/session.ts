import { Router } from "express";
import * as sessionController from "../controllers/sessionController.js";

export const sessionRouter = Router();

sessionRouter.post("/", sessionController.create);
