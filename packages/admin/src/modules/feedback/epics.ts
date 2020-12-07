import { combineEpics } from "redux-observable";
import { filter, mergeMap, map } from "rxjs/operators";
import { isActionOf } from "typesafe-actions";
import { EpicSignature } from "../root";
import { Actions } from "../root-actions";

/** ===========================================================================
 * Epics
 * ============================================================================
 */

/**
 * Fetch all user feedback records.
 */
const fetchAllFeedbackEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf([Actions.fetchAllFeedback, Actions.fetchAdminUser])),
    mergeMap(deps.api.fetchAllFeedbackRecords),
    map(result => {
      if (result.value) {
        return Actions.fetchAllFeedbackSuccess(result.value);
      } else {
        return Actions.fetchAllFeedbackFailure(result.error);
      }
    }),
  );
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default combineEpics(fetchAllFeedbackEpic);
