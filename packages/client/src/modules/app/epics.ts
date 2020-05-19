import queryString from "query-string";
import {
  filter,
  map,
  tap,
  ignoreElements,
  pluck,
  delay,
  withLatestFrom,
  catchError,
} from "rxjs/operators";
import { Observable, merge, defer, of } from "rxjs";
import { isActionOf } from "typesafe-actions";
import { Location } from "history";
import { combineEpics } from "redux-observable";
import { EpicSignature } from "../root";
import { Actions } from "../root-actions";
import {
  parseInitialUrlToInitializationType,
  APP_INITIALIZATION_TYPE,
} from "tools/utils";
import {
  captureSentryMessage,
  captureSentryException,
} from "tools/sentry-utils";

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
    // wait for the "Launching Pairwise..." overlay to disappear as the
    // UI/UX of toast over overlay looks a bit off
    delay(1500),
    tap(params => {
      deps.toaster.error(
        `Login failed! An unknown error occurred when trying to log you ` +
          `in with ${params.strategy}. Please try again.`,
        { timeout: 10000 },
      );
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

interface AmplitudeInstance {
  setUserId: (x: string) => void;
  logEvent: (x: string, opts?: any) => void;
}

interface Amplitude {
  getInstance: () => AmplitudeInstance;
}

declare global {
  interface Window {
    amplitude?: Amplitude;
  }
}

/**
 * An epic to send some custom events to amplitude.
 */
const analyticsEpic: EpicSignature = action$ => {
  const amp$ = defer<Observable<Window["amplitude"]>>(() =>
    of(window.amplitude),
  ).pipe(
    filter((x): x is Amplitude => Boolean(x)),
    map(x => x.getInstance()),
  );

  const identityAnalytic$ = action$.pipe(
    filter(isActionOf(Actions.fetchUserSuccess)),
    tap(x => {
      const { amplitude } = window;
      const { profile } = x.payload;
      const amp = amplitude?.getInstance();
      if (amp && profile) {
        amp.setUserId(profile.uuid);
        amp.logEvent("RETURNING_USER", {
          email: profile.email || "<EMAIL_UNKNOWN>",
        });
      }
    }),
    ignoreElements(),
  );

  const completionAnalytic$ = action$.pipe(
    filter(isActionOf(Actions.updateUserProgress)),
    filter(x => x.payload.complete),
    tap(x => {
      const { amplitude } = window;
      const amp = amplitude?.getInstance();
      const { complete, ...props } = x.payload;
      if (amp) {
        amp.logEvent("CHALLENGE_COMPLETE", props);
      }
    }),
    ignoreElements(),
  );

  const feedbackAnalytic$ = action$.pipe(
    filter(isActionOf(Actions.submitUserFeedback)),
    withLatestFrom(amp$),
    tap(([x, amp]) => {
      amp.logEvent("FEEDBACK_SUBMITTED", {
        challengeId: x.payload.challengeId,
        type: x.payload.type,
      });
    }),
    ignoreElements(),
  );

  return merge(identityAnalytic$, completionAnalytic$, feedbackAnalytic$).pipe(
    catchError((err, stream) => {
      console.warn(`[Low Priority] Analytics error: ${err.message}`);
      captureSentryException(err);
      return stream; // Do not collapse the stream
    }),
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
  analyticsEpic,
);
