import queryString from "query-string";
import {
  filter,
  map,
  tap,
  ignoreElements,
  pluck,
  delay,
  mapTo,
} from "rxjs/operators";
import { Observable } from "rxjs";
import { isActionOf } from "typesafe-actions";
import { Location } from "history";
import { combineEpics } from "redux-observable";
import { EpicSignature } from "../root";
import { Actions } from "../root-actions";
import {
  parseInitialUrlToInitializationType,
  APP_INITIALIZATION_TYPE,
} from "tools/admin-utils";
import io from "socket.io-client";
import { HOST } from "../../tools/admin-env";
import shortid from "shortid";

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

const appInitializeCaptureUrlEpic: EpicSignature = (action$) => {
  return action$.pipe(
    filter(isActionOf(Actions.initializeApp)),
    pluck("payload"),
    pluck("location"),
    map((location) => {
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
 * Fetching courses or user should not fail, but if it does there is some
 * real issue (e.g. the server is down).
 */
const appInitializationFailedEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.fetchCoursesFailure)),
    mapTo(Actions.appInitializationFailed()),
  );
};

const emailUpdateSuccessToastEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.captureAppInitializationUrl)),
    pluck("payload"),
    pluck("appInitializationType"),
    filter((type) => type === APP_INITIALIZATION_TYPE.EMAIL_UPDATED),
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
    filter((params) => Object.keys(params).length > 0),
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

const notifyOnAuthenticationFailureEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.captureAppInitializationUrl)),
    pluck("payload"),
    pluck("appInitializationType"),
    filter((type) => type === APP_INITIALIZATION_TYPE.AUTHENTICATION_FAILURE),
    delay(250),
    tap(() => {
      const { host } = window.location;
      if (host === "localhost" || host === "127.0.0.1:3007") {
        deps.toaster.error(
          `Failed to login. For local development, be sure you created an account first by logging into the workspace using Google.`,
          { timeout: 6000 },
        );
      } else {
        deps.toaster.error(`Failed to login.`, { timeout: 6000 });
      }
    }),
    ignoreElements(),
  );
};

// This epic creates a new stream of locations the user visits. The tap is just
// to make google analytics work with our SPA
const locationChangeEpic: EpicSignature = (_, __, deps) => {
  return new Observable<Location>((obs) => {
    const unsub = deps.router.listen((location) => {
      obs.next(location);
    });

    return unsub;
  }).pipe(map(Actions.locationChange));
};

const connectSocketIOEpic: EpicSignature = (action$, state, deps) => {
  return action$.pipe(
    filter(isActionOf([Actions.initializeApp, Actions.connectSocketIO])),
    map(() => {
      try {
        // Create WebSocket connection.
        const socket = io(HOST, {
          transports: ["websocket"],
        });

        socket.on("connect", () => {
          console.log("WebSocket connection established.");
        });

        socket.on("disconnect", () => {
          console.warn("WebSocket connection disconnected!");
          // TODO: Add re-connect logic here if server disconnects
        });

        // Listen for messages
        socket.on("message", (event) => {
          try {
            const message = event.data;
            const action = Actions.addRealTimeChallengeUpdate({
              id: shortid(),
              challengeId: message.challengeId,
            });

            // Use store dispatch function to dispatch actions in response
            // to socket messages
            deps.dispatch(action);
          } catch (err) {
            console.log("Error handling WebSocket message", err);
          }
        });

        // Assign socket handler to deps to use in other epics
        deps.socket = socket;

        return Actions.connectSocketIOSuccess();
      } catch (err) {
        const msg =
          "Failed to initialize web socket connection, check console for details.";
        deps.toaster.warn(msg);
        console.error(msg, err);
        return Actions.connectSocketIOFailure();
      }
    }),
  );
};

/**
 * Triggers the removal of a real time update after a delay.
 */
const removeRealTimeChallengeUpdateEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.addRealTimeChallengeUpdate)),
    delay(5000),
    map((x) => Actions.removeRealTimeChallengeUpdate(x.payload)),
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
  stripInitialParameters,
  emailUpdateSuccessToastEpic,
  notifyOnAuthenticationFailureEpic,
  locationChangeEpic,
  connectSocketIOEpic,
  removeRealTimeChallengeUpdateEpic,
);
