import { Router } from "express";
import * as userController from "../controllers/userController.js";

export const usersRouter = Router();

usersRouter.post("/", userController.create);
