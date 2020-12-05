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

const fetchUserEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.fetchAdminUser)),
    mergeMap(API.fetchUserProfile),
    map(result => {
      if (result.value) {
        return Actions.fetchAdminUserSuccess(result.value);
      } else {
        deps.toaster.warn(
          "An issue occurred with the Pairwise servers and we could not retrieve your user profile right now.\n\n You are not logged in currently.",
        );
        return Actions.fetchAdminUserFailure(result.error);
      }
    }),
  );
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default combineEpics(
  fetchUserEpic,
);
