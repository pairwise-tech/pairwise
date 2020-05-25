import queryString from "query-string";
import { filter, map, tap, ignoreElements, pluck, delay } from "rxjs/operators";
import { combineLatest, Observable, merge } from "rxjs";
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
  getViewedEmailPromptStatus,
  markEmailPromptAsViewed,
} from "tools/storage-utils";

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

/**
 * After the initialization is complete, strip the query parameters from the
 * original url.
 */
const stripInitialParameters: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.captureAppInitializationUrl)),
    pluck("payload"),
    pluck("params"),
    // Only proceed if there are captured query parameters to remove
    filter(params => Object.keys(params).length > 0),
    tap(() => {
      console.warn(
        `[WARN]: Query parameters being removed on app initialization!`,
      );
      const { router } = deps;
      debug(`Removing query parameters: ${router.location.search}`);
      router.replace(router.location.pathname);
    }),
    ignoreElements(),
  );
};

/**
 * Show a success toast when a user opens the email verification link.
 */
const emailUpdateSuccessToastEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.captureAppInitializationUrl)),
    pluck("payload"),
    pluck("appInitializationType"),
    filter(type => type === APP_INITIALIZATION_TYPE.EMAIL_UPDATED),
    tap(() => {
      deps.toaster.success("Email updated successfully!");
    }),
    ignoreElements(),
  );
};

/**
 * When the app loads, prompt registered users to enter their email if their
 * email doesn't exist yet.
 */
const promptToAddEmailEpic: EpicSignature = (action$, _, deps) => {
  const appInitializedSuccess$ = action$.pipe(
    filter(isActionOf(Actions.captureAppInitializationUrl)),
    pluck("payload"),
    pluck("appInitializationType"),
    filter(type => type === APP_INITIALIZATION_TYPE.DEFAULT),
  );

  // Get users who are registered but have no email
  const userFetchedSuccessNoEmail$ = action$.pipe(
    filter(isActionOf(Actions.fetchUserSuccess)),
    pluck("payload"),
    filter(user => {
      const USER_SIGNED_UP = !!user.profile;
      const NO_EMAIL = !user.profile?.email;
      return USER_SIGNED_UP && NO_EMAIL;
    }),
  );

  return combineLatest(appInitializedSuccess$, userFetchedSuccessNoEmail$).pipe(
    filter(() => {
      // Filter if they have already seen the prompt before.
      const viewedEmailPromptBefore = getViewedEmailPromptStatus();
      return !viewedEmailPromptBefore;
    }),
    tap(() => {
      const redirect = () => deps.router.push("/account");
      deps.toaster.warn("Please add your email to receive course updates.", {
        action: {
          onClick: redirect,
          text: "Setup Email",
        },
      });
    }),
    tap(() => {
      // After showing this, mark it as viewed so the user never sees it again.
      markEmailPromptAsViewed();
    }),
    ignoreElements(),
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

declare global {
  interface Window {
    amplitude?: {
      getInstance: () => {
        setUserId: (x: string) => void;
        logEvent: (x: string, opts?: any) => void;
      };
    };
  }
}

/**
 * An epic to send some custom events to amplitude.
 */
const analyticsEpic: EpicSignature = action$ => {
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

  return merge(identityAnalytic$, completionAnalytic$);
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default combineEpics(
  appInitializationEpic,
  appInitializeCaptureUrlEpic,
  stripInitialParameters,
  emailUpdateSuccessToastEpic,
  promptToAddEmailEpic,
  notifyOnAuthenticationFailureEpic,
  locationChangeEpic,
  analyticsEpic,
);
