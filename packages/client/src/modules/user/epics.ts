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
        return Actions.fetchUserSuccess(result.value);
      } else {
        return Actions.fetchUserFailure(result.error);
      }
    }),
    tap(action => {
      /**
       * TODO: Add additional logic here to not redirect the user if they
       * happen to link to a free workspace challenge.
       */
      if (action.type === getType(Actions.fetchUserFailure)) {
        const { payload } = action;
        if (payload.status === 401) {
          deps.router.push("/home");
        }
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
        deps.toaster.show({
          icon: "tick",
          intent: "danger",
          message: "Failure to update user profile...",
        });
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
