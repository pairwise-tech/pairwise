import { combineEpics } from "redux-observable";
import { filter, ignoreElements, tap } from "rxjs/operators";
import { isActionOf } from "typesafe-actions";

import { EpicSignature } from "../root";
import { Actions } from "../root-actions";

/** ===========================================================================
 * Epics
 * ============================================================================
 */

const appInitializationEpic: EpicSignature = action$ => {
  return action$.pipe(
    filter(isActionOf(Actions.initializeApp)),
    tap(() => {
      /* did something here ~ */
    }),
    ignoreElements(),
  );
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default combineEpics(appInitializationEpic);
