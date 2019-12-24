import { combineEpics } from "redux-observable";
import { filter, tap } from "rxjs/operators";
import { isActionOf } from "typesafe-actions";

import { EpicSignature } from "../root";
import { Actions } from "../root-actions";

/** ===========================================================================
 * Epics
 * ============================================================================
 */

const updateUserEpic: EpicSignature = action$ => {
  return action$.pipe(
    filter(isActionOf(Actions.updateUser)),
    tap(action => {
      console.log("Handle update user...");
    }),
  );
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default combineEpics(updateUserEpic);
