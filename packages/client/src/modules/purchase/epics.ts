import { combineEpics } from "redux-observable";
import { filter, tap, map, mergeMap } from "rxjs/operators";
import { isActionOf } from "typesafe-actions";
import { of } from "rxjs";

import {
  removeEphemeralPurchaseCourseId,
  getEphemeralPurchaseCourseId,
} from "tools/storage-utils";
import { EpicSignature } from "../root";
import { Actions } from "../root-actions";

/** ===========================================================================
 * Epics
 * ============================================================================
 */

const purchaseCourseInitializeEpic: EpicSignature = action$ => {
  return action$.pipe(
    filter(isActionOf(Actions.initializeApp)),
    map(getEphemeralPurchaseCourseId),
    mergeMap(id => {
      if (id) {
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
