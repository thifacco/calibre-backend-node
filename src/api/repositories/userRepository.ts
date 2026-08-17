import { Types } from "mongoose";
import { UserModel, type UserDoc } from "../models/User.js";

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
}

export async function findByEmail(email: string): Promise<UserDoc | null> {
  return UserModel.findOne({ email: email.toLowerCase() }).lean<UserDoc | null>().exec();
}

export async function findById(id: string): Promise<UserDoc | null> {
  if (!Types.ObjectId.isValid(id)) return null;
  return UserModel.findById(id).lean<UserDoc | null>().exec();
}

export async function existsByEmail(email: string): Promise<boolean> {
  const found = await UserModel.exists({ email: email.toLowerCase() }).exec();
  return found !== null;
}

export async function create(data: CreateUserData): Promise<UserDoc> {
  const created = await UserModel.create(data);
  return created.toObject<UserDoc>();
}
