import { combineEpics } from "redux-observable";
import { filter, mergeMap, map, delay } from "rxjs/operators";
import { isActionOf } from "typesafe-actions";
import { EpicSignature } from "../root";
import { Actions } from "../root-actions";

/** ===========================================================================
 * Epics
 * ============================================================================
 */

/**
 * Fetch recent progress records.
 */
const fetchProgressRecordsEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(
      isActionOf([
        Actions.refreshStats,
        Actions.fetchAdminUser,
        Actions.fetchProgressRecords,
      ]),
    ),
    delay(750),
    mergeMap(deps.api.fetchProgressRecords),
    map(result => {
      if (result.value) {
        return Actions.fetchProgressRecordsSuccess(result.value);
      } else {
        return Actions.fetchProgressRecordsFailure(result.error);
      }
    }),
  );
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default combineEpics(fetchProgressRecordsEpic);
