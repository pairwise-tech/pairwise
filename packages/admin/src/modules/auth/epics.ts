import { combineEpics } from "redux-observable";
import {
  filter,
  ignoreElements,
  tap,
  delay,
  mergeMap,
  pluck,
  map,
} from "rxjs/operators";
import { isActionOf } from "typesafe-actions";
import { of } from "rxjs";
import {
  setAccessTokenInLocalStorage,
  logoutUserInLocalStorage,
  getAccessTokenFromLocalStorage,
} from "tools/storage-utils";
import { EpicSignature } from "../root";
import { Actions } from "../root-actions";
import { APP_INITIALIZATION_TYPE } from "tools/admin-utils";
import { matchResult } from "@pairwise/common";

/** ===========================================================================
 * Epics
 * ============================================================================
 */

/**
 * Handle access token initialization. This epic receives an action which is
 * produced when the application first loads (see ApplicationContainer) which
 * contains the initial page URL. This is important because login attempts
 * redirect to the app and pass the accessToken as a parameter, which is
 * then extracted here. If this token does not exist, the token may be in
 * local storage and that is used instead. The result is eventually sent to
 * the next epic which handles the next steps in the access token
 * initialization flow.
 */
const accessTokenInitializationEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.captureAppInitializationUrl)),
    pluck("payload"),
    map((payload) => {
      const { params, appInitializationType } = payload;
      const { accessToken } = params;

      let accountCreated = false;
      let token = getAccessTokenFromLocalStorage();

      if (appInitializationType === APP_INITIALIZATION_TYPE.SIGN_IN) {
        accountCreated = false;
        token = accessToken as string;
      }

      return Actions.storeAccessToken({
        accountCreated,
        accessToken: token,
      });
    }),
  );
};

/**
 * This epic is responsible for storing the access token during the app
 * initialization process. It produces the app initialization success action
 * in addition to an access token success action if an access token is
 * determined to exist.
 */
const storeAccessTokenEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.storeAccessToken)),
    pluck("payload"),
    tap((payload) => {
      const { accessToken } = payload;
      setAccessTokenInLocalStorage(accessToken);
    }),
    mergeMap((payload) => {
      const { accessToken } = payload;
      if (accessToken) {
        return of(
          Actions.fetchAdminUser(),
          Actions.storeAccessTokenSuccess(payload),
          Actions.initializeAppSuccess({ accessToken }),
        );
      } else {
        return of(
          Actions.storeAccessTokenFailure(),
          Actions.initializeAppSuccess({ accessToken }),
          Actions.fetchAdminUserFailure({ message: "Unauthorized" }),
        );
      }
    }),
  );
};

/**
 * Handle logging out the user.
 */
const logoutUserEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.logoutUser)),
    mergeMap(async () => {
      const result = await deps.api.logoutUser();

      matchResult(result, {
        ok: (x) => x,
        err: (e) => {
          console.error("Error occurring processing logout.", e);
        },
      });

      return Actions.logoutUserSuccess();
    }),
  );
};

// Logout the user by removing the local storage access token.
const logoutUserSuccessEpic: EpicSignature = (action$, _, deps) => {
  const logoutToast = () => {
    deps.toaster.success("Logout Success", { icon: "log-out" });
  };

  return action$.pipe(
    filter(isActionOf(Actions.logoutUserSuccess)),
    tap(logoutUserInLocalStorage),
    // Put a short delay so the user feels like something actually happened.
    delay(250),
    tap(logoutToast),
    ignoreElements(),
  );
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default combineEpics(
  accessTokenInitializationEpic,
  storeAccessTokenEpic,
  logoutUserEpic,
  logoutUserSuccessEpic,
);
