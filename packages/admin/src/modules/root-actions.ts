import * as App from "./app/actions";
import * as Auth from "./auth/actions";
import * as Challenges from "./challenges/actions";
import * as User from "./admin/actions";
import * as Users from "./users/actions";
import * as Feedback from "./feedback/actions";
import * as Realtime from "./realtime/actions";

/** ===========================================================================
 * All Actions
 * ============================================================================
 */

export const Actions = {
  ...App,
  ...Auth,
  ...User,
  ...Users,
  ...Realtime,
  ...Feedback,
  ...Challenges,
};
