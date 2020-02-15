import dotenv from "dotenv";

dotenv.config();

/** ===========================================================================
 * Server Config:
 * ============================================================================
 */

export const PORT = 7000;

export const SERVER = process.env.SERVER_URL || "http://127.0.0.1:9000";
