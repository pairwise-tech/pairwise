import { combineEpics } from "redux-observable";
import { filter, tap, map, mergeMap } from "rxjs/operators";
import { isActionOf } from "typesafe-actions";
import { of, combineLatest } from "rxjs";

import {
  removeEphemeralPurchaseCourseId,
  getEphemeralPurchaseCourseId,
} from "tools/storage-utils";
import { EpicSignature } from "../root";
import { Actions } from "../root-actions";
import { CourseSkeletonList } from "@pairwise/common";

/** ===========================================================================
 * Epics
 * ============================================================================
 */

const purchaseCourseInitializeEpic: EpicSignature = action$ => {
  return combineLatest(
    action$.pipe(filter(isActionOf(Actions.fetchNavigationSkeletonSuccess))),
    action$.pipe(filter(isActionOf(Actions.initializeApp))),
  ).pipe(
    map(([action]: any) => action.payload) /* Wtf types!? */,
    mergeMap((skeletons: CourseSkeletonList) => {
      /* Validate that the course id exists */
      const id = getEphemeralPurchaseCourseId();
      const course = skeletons.find(c => c.id === id);
      if (id && course) {
        return of(
          Actions.setPurchaseCourseId(id),
          Actions.setPurchaseCourseModalState(true),
        );
      } else {
        return of(Actions.empty());
      }
    }),
    tap(removeEphemeralPurchaseCourseId),
  );
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default combineEpics(purchaseCourseInitializeEpic);
