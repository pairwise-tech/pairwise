import App from "./app/actions";
import Auth from "./auth/actions";
import Challenges from "./challenges/actions";
import User from "./user/actions";

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
