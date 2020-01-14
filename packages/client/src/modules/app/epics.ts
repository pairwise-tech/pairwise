import { filter, map, tap, ignoreElements } from "rxjs/operators";
import { Observable } from "rxjs";
import { isActionOf } from "typesafe-actions";
import { Location } from "history";

import { EpicSignature } from "../root";
import { Actions } from "../root-actions";
import { combineEpics } from "redux-observable";

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
       *
       * The mobile UI sucks.
       */
      if (window.innerWidth < 768) {
        document.body.style.overflowX = "hidden";
        document.body.style.overflowY = "hidden";
        deps.router.push("/home");
      }
    }),
    ignoreElements(),
  );
};

const locationChangeEpic: EpicSignature = (_, __, deps) => {
  return new Observable<Location>(obs => {
    const unsub = deps.router.listen(location => {
      obs.next(location);
    });

    return unsub;
  }).pipe(map(Actions.locationChange));
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default combineEpics(appInitializationEpic, locationChangeEpic);
