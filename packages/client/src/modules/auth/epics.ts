import axios from "axios";
import { combineEpics } from "redux-observable";
import { filter, map, mergeMap, tap } from "rxjs/operators";
import { isActionOf } from "typesafe-actions";

import * as ENV from "tools/client-env";
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
    mergeMap(async action => {
      try {
        const params = { access_token: action.payload.accessToken };
        const response = await axios.get<{ accessToken: string }>(
          `${ENV.HOST}/auth/facebook`,
          { params },
        );
        const { accessToken } = response.data;
        return Actions.storeAccessToken({ accessToken });
      } catch (err) {
        console.log(err);
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
