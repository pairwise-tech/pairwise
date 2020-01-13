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

const initializeAppAuthenticationEpic: EpicSignature = (action$, _, deps) => {
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
    }),
    tap(action => {
      setAccessTokenInLocalStorage(action.payload.accessToken);
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
  initializeAppAuthenticationEpic,
  logoutEpic,
);
