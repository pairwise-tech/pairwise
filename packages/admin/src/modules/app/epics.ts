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
import { merge, Observable } from "rxjs";
import { isActionOf } from "typesafe-actions";
import { Location } from "history";
import { combineEpics } from "redux-observable";
import { EpicSignature } from "../root";
import { Actions } from "../root-actions";
import {
  parseInitialUrlToInitializationType,
  APP_INITIALIZATION_TYPE,
} from "tools/admin-utils";
import io, { Socket } from "socket.io-client";
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

/**
 * Web Socket connection epic.
 */
const connectSocketIOEpic: EpicSignature = (action$, state, deps) => {
  const init$ = action$.pipe(
    filter(isActionOf(Actions.initializeApp)),
    map(() => Actions.connectSocketIO()),
  );

  const openConnection$ = action$.pipe(
    filter(isActionOf(Actions.connectSocketIO)),
  );

  const setSocket = (s: Nullable<Socket>) => {
    deps.socket = s;
  };

  const handleConnectionFailure = () => {
    deps.dispatch(Actions.connectSocketIOFailure());
    deps.dispatch(Actions.checkSocketIOReconnection());
  };

  return merge(init$, openConnection$).pipe(
    map(() => {
      try {
        // Create WebSocket connection.
        const socket = io(HOST, {
          transports: ["websocket"],
          reconnectionAttempts: 5,
          reconnectionDelay: 2000,
        });

        socket.on("connect", () => {
          if (socket.connected === false) {
            handleConnectionFailure();
          } else {
            // Assign socket handler to deps to use in other epics
            setSocket(socket);
            console.log("WebSocket connection established.");
            deps.dispatch(Actions.connectSocketIOSuccess());
          }
        });

        socket.on("disconnect", (reason: string) => {
          console.warn("WebSocket connection disconnected!");

          if (reason === "io client disconnect") {
            // No op
            return;
          } else if (reason === "transport close") {
            /**
             * This should occur when the server disconnects, which can happen
             * if the Cloud Run instance is rotated. In that case, try to
             * reconnect the socket listener.
             */
            setSocket(null);
            handleConnectionFailure();
          }
        });

        // Listen for messages
        // TODO: Add type information/checking for event objects
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

        return Actions.empty("SocketIO epic placeholder completion action.");
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
 * Delayed check for socket reconnection after a disconnect or connection
 * failure occurs.
 */
const checkSocketReconnectionEpic: EpicSignature = (action$, state$, deps) => {
  return action$.pipe(
    filter(
      isActionOf([Actions.initializeApp, Actions.checkSocketIOReconnection]),
    ),
    delay(12500),
    filter(() => !state$.value.app.socketIOConnected),
    tap(() => {
      deps.toaster.warn("Failed to re-establish web socket connection.");
    }),
    mapTo(Actions.connectSocketIOFailure()),
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
  checkSocketReconnectionEpic,
  removeRealTimeChallengeUpdateEpic,
);
