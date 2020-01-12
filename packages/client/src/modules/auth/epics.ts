import { combineEpics } from "redux-observable";
import { filter, ignoreElements, map, tap } from "rxjs/operators";
import { isActionOf } from "typesafe-actions";

import {
  getAccessTokenFromLocalStorage,
  setAccessTokenInLocalStorage,
  logoutUserInLocalStorage,
} from "tools/utils";
import { EpicSignature } from "../root";
import { Actions } from "../root-actions";

/** ===========================================================================
 * Epics
 * ============================================================================
 */

const initializeAppAuthenticationEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.initializeApp)),
    map(getAccessTokenFromLocalStorage),
    tap(token => {
      /**
       * Redirect the user if the are on a protected route... This could
       * be done with React Router but I like using epics.
       *
       * /account is probably the only protected route like this, but more
       * could be added in the future if needed.
       */
      if (!token) {
        if (deps.router.location.pathname.includes("account")) {
          deps.router.push(`/home`);
        }
      }
    }),
    filter(token => Boolean(token)),
    map(accessToken =>
      Actions.storeAccessToken({ accessToken, accountCreated: false }),
    ),
  );
};

const storeAccessTokenEpic: EpicSignature = action$ => {
  return action$.pipe(
    filter(isActionOf(Actions.storeAccessToken)),
    tap(({ payload }) => {
      const { accessToken } = payload;
      setAccessTokenInLocalStorage(accessToken);
    }),
    map(action => Actions.storeAccessTokenSuccess(action.payload)),
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
  logoutEpic,
  initializeAppAuthenticationEpic,
  storeAccessTokenEpic,
);
