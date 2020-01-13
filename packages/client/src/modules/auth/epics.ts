import queryString from "query-string";
import { combineEpics } from "redux-observable";
import {
  filter,
  ignoreElements,
  tap,
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
const accessTokenInitializationEpic: EpicSignature = action$ => {
  return action$.pipe(
    filter(isActionOf(Actions.initializeAccessToken)),
    pluck("payload"),
    map(payload => {
      let token = getAccessTokenFromLocalStorage();
      let accountCreatedField = false;

      const search = payload.initialWindowLocationSearch;
      const { accessToken, accountCreated } = queryString.parse(search);

      const created =
        typeof accountCreated === "string" ? JSON.parse(accountCreated) : false;

      if (typeof accessToken === "string" && typeof created === "boolean") {
        console.log(`Login detected! Account created: ${created}`);
        token = accessToken;
        accountCreatedField = created;
      }

      return Actions.storeAccessToken({
        accessToken: token,
        accountCreated: accountCreatedField,
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
    tap(({ payload }) => {
      const { accessToken } = payload;

      /**
       * Redirect the user if the are on a protected route... This could
       * be done with React Router but I like using epics.
       *
       * /account is probably the only protected route like this, but more
       * could be added in the future if needed.
       */
      if (!accessToken) {
        if (deps.router.location.pathname.includes("account")) {
          deps.router.push(`/home`);
        }
      }

      setAccessTokenInLocalStorage(accessToken);
    }),
    mergeMap(({ payload }) => {
      const { accessToken } = payload;
      const initAction = Actions.initializeAppSuccess({ accessToken });
      if (accessToken) {
        return of(initAction, Actions.storeAccessTokenSuccess(payload));
      } else {
        return of(initAction);
      }
    }),
  );
};

/**
 * This epic should only run one time per user: the first time the user creates
 * an account which will result in the access token initialization flow with
 * the { accountCreated: true } field.
 *
 * In this case, we want to start a process to persist any of their local
 * saved progress to their new account on the server. The steps would be:
 *
 * [1] Set a flag to indicate this process is underway.
 * [2] Retrieve local storage data and send each entry in a request to the server.
 * [3] In the request fails, ignore the failure.
 * [4] After success or failure, remove the value from local storage.
 * [5] Continue until all requests are processed.
 * [6] Also check for this flag on app startup in case the user reloads the page.
 * [7] Once there are no more entries in local storage, remove the temporary flag.
 * [8] The process is now complete.
 */
const accountCreationEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.storeAccessTokenSuccess)),
    pluck("payload"),
    pluck("accountCreated"),
    filter(Boolean),
    mergeMap(async () => {
      console.log(
        "[TODO]: Handling persisting any local user history to the server!",
      );
      deps.toaster.show({
        intent: "warning",
        message:
          "Syncing your progress to your new account, please wait a moment and do not close your browser window.",
      });
      await deps.api.handleDataPersistenceForNewAccount();
      deps.toaster.show({
        intent: "success",
        message: "Updates saved! You are good to go!",
      });
    }),
    ignoreElements(),
  );
};

/**
 * Logging out the current user involves removing the current access token
 * from local storage.
 */
const logoutEpic: EpicSignature = action$ => {
  return action$.pipe(
    filter(isActionOf(Actions.logoutUser)),
    tap(logoutUserInLocalStorage),
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
  accountCreationEpic,
  logoutEpic,
);
