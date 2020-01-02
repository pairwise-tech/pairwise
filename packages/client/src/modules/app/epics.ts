import { combineEpics } from "redux-observable";
import { filter, ignoreElements, map, pluck, tap } from "rxjs/operators";
import { isActionOf } from "typesafe-actions";

import { EpicSignature } from "../root";
import { Actions } from "../root-actions";

/** ===========================================================================
 * Epics
 * ============================================================================
 */

const appInitializationEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.initializeApp)),
    tap(() => {
      /**
       * On app load for mobile sized devices, direct /home and lock
       * the page scrolling.
       */
      if (window.innerWidth < 768) {
        document.body.style.overflowX = "hidden";
        document.body.style.overflowY = "hidden";
        deps.router.push("/home");
      }
    }),
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
