import { combineEpics } from "redux-observable";
import { filter, mergeMap, map, pluck } from "rxjs/operators";
import { isActionOf } from "typesafe-actions";
import { EpicSignature } from "../root";
import { Actions } from "../root-actions";
import { of } from "rxjs/internal/observable/of";

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

/**
 * Gift the course to a user.
 */
const giftCourseForUserEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.giftCourseForUser)),
    pluck("payload"),
    mergeMap(deps.api.giftCourseForUser),
    mergeMap(result => {
      if (result.value) {
        deps.toaster.success("Course purchase successful!");
        return of(
          Actions.fetchUsers(),
          Actions.giftCourseForUserSuccess(result.value),
        );
      } else {
        deps.toaster.error("Course purchase failed.");
        return of(Actions.giftCourseForUserFailure(result.error));
      }
    }),
  );
};

/**
 * Refund the course for a user.
 */
const refundCourseForUserEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.refundCourseForUser)),
    pluck("payload"),
    mergeMap(deps.api.refundCourseForUser),
    mergeMap(result => {
      if (result.value) {
        deps.toaster.success("Course refund successful!");
        return of(
          Actions.fetchUsers(),
          Actions.refundCourseForUserSuccess(result.value),
        );
      } else {
        deps.toaster.error("Course refund failed.");
        return of(Actions.refundCourseForUserFailure(result.error));
      }
    }),
  );
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default combineEpics(
  fetchAllPaymentsEpic,
  giftCourseForUserEpic,
  refundCourseForUserEpic,
);
