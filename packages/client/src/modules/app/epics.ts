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
  distinct,
  mapTo,
} from "rxjs/operators";
import { Observable, merge, defer, of, combineLatest } from "rxjs";
import { isActionOf } from "typesafe-actions";
import { Location } from "history";
import { combineEpics } from "redux-observable";
import { EpicSignature } from "../root";
import { Actions } from "../root-actions";
import {
  parseInitialUrlToInitializationType,
  APP_INITIALIZATION_TYPE,
} from "tools/utils";
import { captureSentryException } from "tools/sentry-utils";
import {
  getViewedEmailPromptStatus,
  markEmailPromptAsViewed,
} from "tools/storage-utils";

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
 * Start the payment intent flow if a user deep links to it. The deep
 * link is to /purchase and can accept a courseId param or default
 * to the TypeScript course.
 */
const purchaseCourseDeepLinkEpic: EpicSignature = (action$, state$) => {
  /**
   * NOTE: We wait for the user and courses to be fetched before handling
   * the next step. We need the course list to validate the courseId param
   * and the user is needed to correctly handle the payment intent step,
   * which is after this.
   *
   * None of this will happen if either the user or course fails to fetch
   * successfully, but that is probably OK.
   */
  const userFetchedSuccess$ = action$.pipe(
    filter(isActionOf(Actions.fetchUserSuccess)),
  );
  const courseFetchedSuccess$ = action$.pipe(
    filter(isActionOf(Actions.fetchCoursesSuccess)),
  );
  const captureAppInitUrl$ = action$.pipe(
    filter(isActionOf(Actions.captureAppInitializationUrl)),
  );

  return combineLatest(
    captureAppInitUrl$,
    userFetchedSuccess$,
    courseFetchedSuccess$,
  ).pipe(
    map(x => x[0]), // Extract the app initialization payload
    pluck("payload"),
    filter(
      x =>
        x.appInitializationType ===
        APP_INITIALIZATION_TYPE.PURCHASE_COURSE_FLOW,
    ),
    pluck("params"),
    pluck("courseId"),
    map((id: any) => {
      // A set of course ids which exist
      const courseIds = new Set(
        state$.value.challenges.courseSkeletons?.map(x => x.id),
      );

      // Default to the TypeScript course id
      const TYPESCRIPT_COURSE_ID = "fpvPtfu7s";
      // NOTE: The courseId param is not validated anywhere...
      const courseId = courseIds.has(id) ? id : TYPESCRIPT_COURSE_ID;

      // Check if the user has already paid for the course, just in case...
      const { payments } = state$.value.user.user;
      const userPaid = payments?.find(p => p.courseId === courseId);
      if (userPaid) {
        return Actions.empty(
          `Handling /purchase deep link but it turns out user has already paid for the course, id: ${courseId}`,
        );
      }

      return Actions.handlePaymentCourseIntent({
        courseId,
        showToastWarning: true,
      });
    }),
  );
};

/**
 * Fetching courses or user should not fail, but if it does there is some
 * real issue (e.g. the server is down).
 */
const appInitializationFailedEpic: EpicSignature = action$ => {
  return action$.pipe(
    filter(isActionOf([Actions.fetchUserFailure, Actions.fetchCoursesFailure])),
    filter(action => {
      // Ajax status 0 can occur, I think, when a request is aborted because a
      // user is navigating away from a page. This could happen if a user
      // decides to navigate back while Pairwise is loading, and in such cases
      // we don't want to report request failures as errors.
      return action.payload.status !== 0;
    }),
    tap(action => {
      captureSentryException(
        new Error(
          `App initialization failed! What we know: ${JSON.stringify(
            action.payload,
          )}`,
        ),
      );
    }),
    mapTo(Actions.appInitializationFailed()),
  );
};

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
      router.replace(router.location.pathname);
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
      const page = `${location.pathname}${location.search}`;
      try {
        // @ts-ignore
        window.ga("set", "page", page);
        // @ts-ignore
        window.ga("send", "pageview");
      } catch (err) {
        // Nothing
      }
    }),
    map(Actions.locationChange),
  );
};

/** ===========================================================================
 * Analytics Epics
 * ============================================================================
 */

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

export enum ANALYTICS_EVENTS {
  RETURNING_USER = "RETURNING_USER",
  CHALLENGE_COMPLETE = "CHALLENGE_COMPLETE",
  REVEAL_SOLUTION_CODE = "REVEAL_SOLUTION_CODE",
  FEEDBACK_SUBMITTED = "FEEDBACK_SUBMITTED",
  LAUNCH_SCREENSAVER = "LAUNCH_SCREENSAVER",
  START_POMODORO_SESSION = "START_POMODORO_SESSION",
}

/**
 * An epic to send some custom events to amplitude.
 */
const analyticsEpic: EpicSignature = (action$, state$) => {
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
        amp.logEvent(ANALYTICS_EVENTS.RETURNING_USER, {
          email: profile.email || "<EMAIL_UNKNOWN>",
        });
      }
    }),
    ignoreElements(),
  );

  const completionAnalytic$ = action$.pipe(
    filter(isActionOf(Actions.updateUserProgress)),
    filter(x => x.payload.complete),
    distinct(x => x.payload.challengeId), // Do not double-log completion of the same challenge
    tap(x => {
      const { amplitude } = window;
      const amp = amplitude?.getInstance();
      const { complete, ...props } = x.payload;
      if (amp) {
        amp.logEvent(ANALYTICS_EVENTS.CHALLENGE_COMPLETE, props);
      }
    }),
    ignoreElements(),
  );

  const revealSolutionAnalytic$ = action$.pipe(
    filter(isActionOf(Actions.toggleRevealSolutionCode)),
    pluck("payload"),
    pluck("shouldReveal"),
    tap(() => {
      const { amplitude } = window;
      const amp = amplitude?.getInstance();
      const props = {
        challengeId: state$.value.challenges.currentChallengeId,
      };
      if (amp) {
        amp.logEvent(ANALYTICS_EVENTS.REVEAL_SOLUTION_CODE, props);
      }
    }),
    ignoreElements(),
  );

  const feedbackAnalytic$ = action$.pipe(
    filter(isActionOf(Actions.submitUserFeedback)),
    withLatestFrom(amp$),
    tap(([x, amp]) => {
      amp.logEvent(ANALYTICS_EVENTS.FEEDBACK_SUBMITTED, {
        challengeId: x.payload.challengeId,
        type: x.payload.type,
      });
    }),
    ignoreElements(),
  );

  const screensaverAnalytic$ = action$.pipe(
    filter(isActionOf(Actions.setScreensaverState)),
    filter(x => !!x.payload),
    withLatestFrom(amp$),
    tap(([_, amp]) => {
      amp.logEvent(ANALYTICS_EVENTS.LAUNCH_SCREENSAVER);
    }),
    ignoreElements(),
  );

  return merge(
    identityAnalytic$,
    completionAnalytic$,
    feedbackAnalytic$,
    revealSolutionAnalytic$,
    screensaverAnalytic$,
  ).pipe(
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
  appInitializationFailedEpic,
  appInitializeCaptureUrlEpic,
  purchaseCourseDeepLinkEpic,
  stripInitialParameters,
  emailUpdateSuccessToastEpic,
  promptToAddEmailEpic,
  notifyOnAuthenticationFailureEpic,
  locationChangeEpic,
  analyticsEpic,
);
