import { combineEpics } from "redux-observable";
import { filter, map, mergeMap, tap } from "rxjs/operators";
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
        Actions.deleteUserAccountSuccess,
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
    filter(isActionOf(Actions.markCoachingSessionComplete)),
    map((x) => x.payload.userUuid),
    mergeMap(async (uuid) => {
      const result = await API.revokeCoachingSessionForUser(uuid);
      if (result.value) {
        deps.toaster.success("Coaching session revoked.");
        return Actions.markCoachingSessionCompleteSuccess({ userUuid: uuid });
      } else {
        deps.toaster.error("Failed to revoke coaching session.");
        return Actions.markCoachingSessionCompleteFailure(result.error);
      }
    }),
  );
};

const deleteUserAccountEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.deleteUserAccount)),
    tap(() => deps.toaster.warn("Deleting user account...")),
    map((x) => x.payload.uuid),
    mergeMap(API.deleteUserAccount),
    map((result) => {
      if (result.value) {
        deps.toaster.success("User account deleted successfully.");
        return Actions.deleteUserAccountSuccess();
      } else {
        deps.toaster.warn(
          "An issued occurred. Please try again or email contact@pairwise.tech for help.",
        );
        return Actions.deleteUserAccountFailure(result.error);
      }
    }),
  );
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default combineEpics(
  fetchUsersEpic,
  revokeCoachingSessionEpic,
  deleteUserAccountEpic,
);
