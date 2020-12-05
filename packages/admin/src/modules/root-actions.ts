import * as App from "./app/actions";
import * as Auth from "./auth/actions";
import * as Challenges from "./challenges/actions";
import * as User from "./user/actions";

/** ===========================================================================
 * All Actions
 * ============================================================================
 */

export const Actions = {
  ...App,
  ...Auth,
  ...User,
  ...Challenges,
};
