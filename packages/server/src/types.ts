import { Request } from "express";
import { IUserDto } from "@pairwise/common";
import { User } from "./user/user.entity";

/** ===========================================================================
 * Common shared type definitions for the Nest app
 * ============================================================================
 */

export type RequestUser = IUserDto<User>;

export type AuthenticatedRequest = Request & { user: RequestUser };
