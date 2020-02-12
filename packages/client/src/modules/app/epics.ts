import { delay, filter, map, tap, ignoreElements } from "rxjs/operators";
import { Observable } from "rxjs";
import { isActionOf } from "typesafe-actions";
import { Location } from "history";
import { combineEpics } from "redux-observable";
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
       * Nothing happens now...
       */
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

const logoutUserSuccess: EpicSignature = (action$, _, deps) => {
  const logoutToast = () => {
    deps.toaster.show({
      icon: "log-out",
      intent: "primary",
      message: "Logout Success",
    });
  };

  return action$.pipe(
    filter(isActionOf(Actions.logoutUser)),
    delay(500),
    tap(logoutToast),
    ignoreElements(),
  );
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default combineEpics(
  appInitializationEpic,
  locationChangeEpic,
  logoutUserSuccess,
);
