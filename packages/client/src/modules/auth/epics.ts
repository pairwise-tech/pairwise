import { combineEpics } from "redux-observable";
import { filter, ignoreElements, map, tap } from "rxjs/operators";
import { isActionOf } from "typesafe-actions";

import {
  getAccessTokenFromLocalStorage,
  setAccessTokenInLocalStorage,
} from "tools/utils";
import { EpicSignature } from "../root";
import { Actions } from "../root-actions";

/** ===========================================================================
 * Epics
 * ============================================================================
 */

const initializeAppAuthenticationEpic: EpicSignature = (action$, state$) => {
  return action$.pipe(
    filter(isActionOf(Actions.initializeApp)),
    map(getAccessTokenFromLocalStorage),
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
    tap(() => {
      setAccessTokenInLocalStorage("");
    }),
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
