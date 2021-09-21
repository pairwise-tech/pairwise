import { combineEpics } from "redux-observable";
import { interval } from "rxjs";
import { filter, map, delay, switchMap, mapTo, take } from "rxjs/operators";
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
    switchMap(deps.api.fetchProgressRecords),
    map((result) => {
      if (result.value) {
        return Actions.fetchProgressRecordsSuccess(result.value);
      } else {
        return Actions.fetchProgressRecordsFailure(result.error);
      }
    }),
  );
};

// 3 minutes
const REFRESH_INTERVAL = 1000 * 60 * 3;

/**
 * After app launch refresh the app stats on an interval.
 */
const refreshStatsEpic: EpicSignature = (action$) => {
  return action$.pipe(
    filter(isActionOf(Actions.initializeAppSuccess)),
    take(1),
    switchMap(() => {
      return interval(REFRESH_INTERVAL).pipe(
        mapTo(Actions.refreshStats({ disableLoadingState: true })),
      );
    }),
  );
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default combineEpics(fetchProgressRecordsEpic, refreshStatsEpic);
