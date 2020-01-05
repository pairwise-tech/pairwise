import { Request } from "express";

/** ===========================================================================
 * Common shared type definitions for the Nest app
 * ============================================================================
 */

export interface RequestUser {
  email: string;
  uuid: string;
}

export type AuthenticatedRequest = Request & { user: RequestUser };
