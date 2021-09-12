require("dotenv").config();
import getenv from "getenv";

/** ===========================================================================
 * Environment Variables
 * ============================================================================
 */

const HOST = getenv.string("HOST", "http://localhost:9000");

const USER_COUNT = getenv.int("USER_COUNT", 100);

const USER_CHALLENGE_COUNT = getenv.int("USER_CHALLENGE_COUNT", 15);

const ENV = {
  HOST,
  USER_COUNT,
  USER_CHALLENGE_COUNT,
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default ENV;
