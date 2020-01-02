import { combineEpics } from "redux-observable";
import { filter, map, mergeMap, tap } from "rxjs/operators";
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

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default combineEpics(fetchUserEpic);
