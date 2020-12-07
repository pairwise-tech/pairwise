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
 * Fetch all user payments records.
 */
const fetchAllPaymentsEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf([Actions.fetchAllPayments, Actions.fetchAdminUser])),
    mergeMap(deps.api.fetchAllPaymentRecords),
    map(result => {
      if (result.value) {
        return Actions.fetchAllPaymentsSuccess(result.value);
      } else {
        return Actions.fetchAllPaymentsFailure(result.error);
      }
    }),
  );
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default combineEpics(fetchAllPaymentsEpic);
