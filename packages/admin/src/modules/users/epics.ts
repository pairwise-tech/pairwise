import { combineEpics } from "redux-observable";
import { filter, map, mergeMap } from "rxjs/operators";
import { isActionOf } from "typesafe-actions";
import API from "modules/api";
import { EpicSignature } from "../root";
import { Actions } from "../root-actions";

/** ===========================================================================
 * Epics
 * ============================================================================
 */

const fetchUsersEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(
      isActionOf([
        Actions.fetchUsers,
        Actions.refreshStats,
        Actions.fetchAdminUserSuccess,
      ]),
    ),
    mergeMap(API.fetchUsersList),
    map((result) => {
      if (result.value) {
        return Actions.fetchUsersSuccess(result.value);
      } else {
        return Actions.fetchUsersFailure(result.error);
      }
    }),
  );
};

const revokeCoachingSessionEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.revokeCoachingSession)),
    map((x) => x.payload.userUuid),
    mergeMap(async (uuid) => {
      const result = await API.revokeCoachingSessionForUser(uuid);
      if (result.value) {
        deps.toaster.success("Coaching session revoked.");
        return Actions.revokeCoachingSessionSuccess({ userUuid: uuid });
      } else {
        deps.toaster.error("Failed to revoke coaching session.");
        return Actions.revokeCoachingSessionFailure(result.error);
      }
    }),
  );
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default combineEpics(fetchUsersEpic, revokeCoachingSessionEpic);
