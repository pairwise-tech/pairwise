import { Request } from "express";

export interface RequestUser {
  email: string;
  uuid: string;
}

export type AuthenticatedRequest = Request & { user: RequestUser };
