import { combineEpics } from "redux-observable";
import { filter, map, mergeMap, tap, pluck } from "rxjs/operators";
import { getType, isActionOf } from "typesafe-actions";

import API from "modules/api";
import { EpicSignature } from "../root";
import { Actions } from "../root-actions";

/** ===========================================================================
 * Epics
 * ============================================================================
 */

const fetchUserEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.storeAccessTokenSuccess)),
    mergeMap(API.fetchUserProfile),
    map(result => {
      if (result.value) {
        const user = result.value;
        if (user.profile.lastActiveChallengeId) {
          deps.router.push(`/workspace/${user.profile.lastActiveChallengeId}`);
        }

        return Actions.fetchUserSuccess(user);
      } else {
        return Actions.fetchUserFailure(result.error);
      }
    }),
  );
};

const updateUserEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.updateUser)),
    pluck("payload"),
    mergeMap(API.updateUser),
    map(result => {
      if (result.value) {
        deps.toaster.show({
          icon: "tick",
          intent: "success",
          message: "Saved 👍",
        });
        return Actions.updateUserSuccess(result.value);
      } else {
        if (result.error.status !== 401) {
          deps.toaster.show({
            icon: "tick",
            intent: "danger",
            message: "Failure to update user profile...",
          });
        }
        return Actions.updateUserFailure(result.error);
      }
    }),
  );
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default combineEpics(fetchUserEpic, updateUserEpic);
