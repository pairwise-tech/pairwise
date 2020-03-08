import queryString from "query-string";
import { filter, map, tap, ignoreElements, pluck, delay } from "rxjs/operators";
import { Observable } from "rxjs";
import { isActionOf } from "typesafe-actions";
import { Location } from "history";
import { combineEpics } from "redux-observable";
import { EpicSignature } from "../root";
import { Actions } from "../root-actions";
import {
  parseInitialUrlToInitializationType,
  APP_INITIALIZATION_TYPE,
} from "tools/utils";

const debug = require("debug")("client:app:epics");

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

const appInitializeCaptureUrlEpic: EpicSignature = action$ => {
  return action$.pipe(
    filter(isActionOf(Actions.initializeApp)),
    pluck("payload"),
    pluck("location"),
    map(location => {
      const params = queryString.parse(location.search);
      const appInitializationType = parseInitialUrlToInitializationType(
        location.pathname,
        params,
      );
      return Actions.captureAppInitializationUrl({
        params,
        location,
        appInitializationType,
      });
    }),
  );
};

const notifyOnAuthenticationFailureEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.captureAppInitializationUrl)),
    pluck("payload"),
    filter(
      x =>
        x.appInitializationType ===
        APP_INITIALIZATION_TYPE.AUTHENTICATION_FAILURE,
    ),
    pluck("params"),
    // wait for the page/workspace to fully load
    delay(1500),
    tap(params => {
      if (params.emailError === "true") {
        deps.toaster.error(
          `Login failed! We could not find your email address. Is the email ` +
            `associated with your ${params.strategy} account private? If so, ` +
            `you may need to login with a different provider.`,
          { timeout: 10000 },
        );
      } else {
        deps.toaster.error(
          `Login failed! An unknown error occurred when trying to log you ` +
            `in with ${params.strategy}. Please try again.`,
          { timeout: 10000 },
        );
      }
    }),
    ignoreElements(),
  );
};

// This epic creates a new stream of locations the user visits. The tap is just
// to make google analytics work with our SPA
const locationChangeEpic: EpicSignature = (_, __, deps) => {
  return new Observable<Location>(obs => {
    const unsub = deps.router.listen(location => {
      obs.next(location);
    });

    return unsub;
  }).pipe(
    tap(location => {
      try {
        // @ts-ignore
        window.ga("set", "page", location.pathname + location.search);
        // @ts-ignore
        window.ga("send", "pageview");
      } catch (err) {
        debug("[INFO] Google analytics related error:", err.message);
      }
    }),
    map(Actions.locationChange),
  );
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default combineEpics(
  appInitializationEpic,
  appInitializeCaptureUrlEpic,
  notifyOnAuthenticationFailureEpic,
  locationChangeEpic,
);
