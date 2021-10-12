import { combineEpics } from "redux-observable";
import { filter, map, mergeMap, pluck } from "rxjs/operators";
import { isActionOf } from "typesafe-actions";
import API from "modules/api";
import { EpicSignature } from "../root";
import { Actions } from "../root-actions";
import { matchResult } from "@pairwise/common";

/** ===========================================================================
 * Epics
 * ============================================================================
 */

const fetchUserEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.fetchAdminUser)),
    mergeMap(API.fetchUserProfile),
    map((result) => {
      return matchResult(result, {
        ok: (x) => Actions.fetchAdminUserSuccess(x),
        err: (e) => Actions.fetchAdminUserFailure(e),
      });
    }),
  );
};

const updateUserSettingsEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.updateUserSettings)),
    pluck("payload"),
    mergeMap(API.updateUserSettings),
    map((result) => {
      return matchResult(result, {
        ok: (x) => Actions.updateUserSettingsSuccess(x),
        err: (e) => Actions.updateUserSettingsFailure(e),
      });
    }),
  );
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default combineEpics(fetchUserEpic, updateUserSettingsEpic);
