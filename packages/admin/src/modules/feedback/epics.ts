import { combineEpics } from "redux-observable";
import { filter, mergeMap, map, pluck } from "rxjs/operators";
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
    filter(
      isActionOf([
        Actions.fetchAllFeedback,
        Actions.fetchAdminUser,
        Actions.deleteFeedbackByUuidSuccess,
      ]),
    ),
    mergeMap(deps.api.fetchAllFeedbackRecords),
    map((result) => {
      if (result.value) {
        return Actions.fetchAllFeedbackSuccess(result.value);
      } else {
        return Actions.fetchAllFeedbackFailure(result.error);
      }
    }),
  );
};

/**
 * Delete a feedback record by uuid.
 */
const deleteFeedbackByUuidEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.deleteFeedbackByUuid)),
    pluck("payload"),
    mergeMap(deps.api.deleteFeedbackByUuid),
    map((result) => {
      if (result.value) {
        deps.toaster.success("Feedback record deleted.");
        return Actions.deleteFeedbackByUuidSuccess(result.value);
      } else {
        deps.toaster.error(`Failed to delete feedback record, ${result.error}`);
        return Actions.deleteFeedbackByUuidFailure(result.error);
      }
    }),
  );
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default combineEpics(fetchAllFeedbackEpic, deleteFeedbackByUuidEpic);
