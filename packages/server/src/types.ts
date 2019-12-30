import { Request } from "express";
import { User } from "./user/user.entity";

export type AuthenticatedRequest = Request & { user: User };
