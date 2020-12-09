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
    filter(isActionOf([Actions.fetchAdminUserSuccess, Actions.refreshStats])),
    mergeMap(API.fetchUsersList),
    map(result => {
      if (result.value) {
        return Actions.fetchUsersSuccess(result.value);
      } else {
        return Actions.fetchUsersFailure(result.error);
      }
    }),
  );
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default combineEpics(fetchUsersEpic);
