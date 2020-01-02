import { combineEpics } from "redux-observable";
import { filter, ignoreElements, map, pluck } from "rxjs/operators";
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
    map(() => Actions.initializeAppSuccess()),
  );
};

const togglePageScrollLockEpic: EpicSignature = action$ => {
  return action$.pipe(
    filter(isActionOf(Actions.toggleScrollLock)),
    pluck("payload"),
    pluck("locked"),
    map(locked => {
      /* hi */
      if (locked) {
        document.body.style.overflowY = "hidden";
      } else {
        document.body.style.overflowY = "scroll";
      }
    }),
    ignoreElements(),
  );
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default combineEpics(appInitializationEpic, togglePageScrollLockEpic);
