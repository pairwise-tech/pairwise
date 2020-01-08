import { filter, map, tap } from "rxjs/operators";
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

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default appInitializationEpic;
