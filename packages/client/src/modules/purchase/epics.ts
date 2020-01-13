import { combineEpics } from "redux-observable";
import { filter, tap, mergeMap } from "rxjs/operators";
import { isActionOf } from "typesafe-actions";
import { of, combineLatest } from "rxjs";

import {
  removeEphemeralPurchaseCourseId,
  getEphemeralPurchaseCourseId,
  setEphemeralPurchaseCourseId,
} from "tools/storage-utils";
import { EpicSignature } from "../root";
import { Actions } from "../root-actions";
import { CourseSkeletonList } from "@pairwise/common";
import { userSelector } from "modules/user/selectors";

/** ===========================================================================
 * Epics
 * ============================================================================
 */

const purchaseCourseInitializeEpic: EpicSignature = action$ => {
  return combineLatest(
    action$.pipe(filter(isActionOf(Actions.fetchNavigationSkeletonSuccess))),
    action$.pipe(filter(isActionOf(Actions.storeAccessTokenSuccess))),
  ).pipe(
    /* Wtf: types!? */
    mergeMap(([skeletonAction, initAction]: any) => {
      if (initAction.payload.accessToken) {
        const skeletons: CourseSkeletonList = skeletonAction.payload;

        /* Validate that the course id exists */
        const id = getEphemeralPurchaseCourseId();

        const course = skeletons.find(c => c.id === id);
        if (id && course) {
          return of(
            Actions.setPurchaseCourseId(id),
            Actions.setPurchaseCourseModalState(true),
          );
        }
      }

      return of(Actions.empty("No purchase course id actions to take"));
    }),
    tap(removeEphemeralPurchaseCourseId),
  );
};

const handlePurchaseCourseIntentEpic: EpicSignature = (
  action$,
  state$,
  deps,
) => {
  return action$.pipe(
    filter(isActionOf(Actions.handlePurchaseCourseIntent)),
    mergeMap(action => {
      const courseId = action.payload.courseId;
      const user = userSelector(state$.value);
      if (user) {
        return of(
          Actions.setPurchaseCourseId(courseId),
          Actions.setPurchaseCourseModalState(true),
        );
      } else {
        deps.toaster.show({
          icon: "user",
          intent: "primary",
          message: "Please create an account to purchase the course",
        });
        setEphemeralPurchaseCourseId(courseId);
        return of(
          Actions.setPurchaseCourseId(courseId),
          Actions.setSingleSignOnDialogState(true),
        );
      }
    }),
  );
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default combineEpics(
  purchaseCourseInitializeEpic,
  handlePurchaseCourseIntentEpic,
);
