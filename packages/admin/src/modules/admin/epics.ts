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
    map((result) => {
      if (result.value) {
        return Actions.fetchAdminUserSuccess(result.value);
      } else {
        return Actions.fetchAdminUserFailure(result.error);
      }
    }),
  );
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default combineEpics(fetchUserEpic);
