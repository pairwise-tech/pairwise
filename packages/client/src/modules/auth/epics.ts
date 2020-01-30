import queryString from "query-string";
import { combineEpics } from "redux-observable";
import {
  filter,
  ignoreElements,
  tap,
  mergeMap,
  pluck,
  map,
  mapTo,
  mergeMapTo,
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
      return of(
        Actions.storeAccessTokenSuccess(payload),
        Actions.initializeAppSuccess({ accessToken }),
      );
    }),
  );
};

/**
 * This epic should only run one time per user: the first time the user creates
 * an account which will result in the access token initialization flow with
 * the { accountCreated: true } field.
 *
 * In this case, we want to start a process to persist any of their local
 * saved progress to their new account on the server.
 */
const accountCreationEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.storeAccessTokenSuccess)),
    pluck("payload"),
    pluck("accountCreated"),
    filter(Boolean),
    mapTo(Actions.initiateBulkPersistence()),
  );
};

/* Nice! */
const bulkPersistenceEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.initiateBulkPersistence)),
    mergeMap(deps.api.handleDataPersistenceForNewAccount),
    mergeMapTo(of(Actions.fetchUser(), Actions.bulkPersistenceComplete())),
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
  bulkPersistenceEpic,
  logoutEpic,
);
