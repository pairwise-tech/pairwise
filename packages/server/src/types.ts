import { Request } from "express";
import { User } from "./user/user.entity";

/** ===========================================================================
 * Common shared type definitions for the Nest app
 * ============================================================================
 */

export type RequestUser = User;

export type AuthenticatedRequest = Request & { user: User };
