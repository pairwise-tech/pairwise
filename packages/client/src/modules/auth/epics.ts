import { combineEpics } from "redux-observable";
import { filter, map, mergeMap, tap } from "rxjs/operators";
import { isActionOf } from "typesafe-actions";

import API from "modules/api";
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

const facebookLoginEpic: EpicSignature = action$ => {
  return action$.pipe(
    filter(isActionOf(Actions.facebookLogin)),
    map(action => action.payload),
    mergeMap(API.facebookAuthenticationRequest),
    map(result => {
      if (result.value) {
        return Actions.storeAccessToken({ accessToken: result.value });
      } else {
        return Actions.facebookLoginFailure();
      }
    }),
  );
};

const initializeAppAuthenticationEpic: EpicSignature = (action$, state$) => {
  return action$.pipe(
    filter(isActionOf(Actions.initializeApp)),
    map(getAccessTokenFromLocalStorage),
    filter(token => Boolean(token)),
    map(accessToken => Actions.storeAccessToken({ accessToken })),
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

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default combineEpics(
  facebookLoginEpic,
  initializeAppAuthenticationEpic,
  storeAccessTokenEpic,
);
