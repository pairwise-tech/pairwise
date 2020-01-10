import { Request } from "express";
import { IUserDto } from "@pairwise/common";

/** ===========================================================================
 * Common shared type definitions for the Nest app
 * ============================================================================
 */

export type RequestUser = IUserDto;

export type AuthenticatedRequest = Request & { user: IUserDto };
