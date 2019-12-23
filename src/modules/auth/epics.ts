import axios from "axios";
import { combineEpics } from "redux-observable";
import { filter, mergeMap, tap } from "rxjs/operators";
import { isActionOf } from "typesafe-actions";

import { setAccessTokenInLocalStorage } from "tools/utils";
import { EpicSignature } from "../root";
import { Actions } from "../root-actions";

/** ===========================================================================
 * Epics
 * ============================================================================
 */

const facebookLoginEpic: EpicSignature = action$ => {
  return action$.pipe(
    filter(isActionOf(Actions.facebookLogin)),
    mergeMap(async response => {
      try {
        console.log("Received FB response!");
        console.log(response);
        const { accessToken } = response.payload;
        const authResponse = await axios.get(
          "http://localhost:9000/auth/facebook",
          {
            params: { access_token: accessToken },
          },
        );

        console.log(authResponse);
        return Actions.facebookLoginSuccess({ accessToken });
      } catch (err) {
        console.log(err);
        return Actions.facebookLoginFailure();
      }
    }),
  );
};

const storeAccessTokenEpic: EpicSignature = action$ => {
  return action$.pipe(
    filter(isActionOf(Actions.facebookLoginSuccess)),
    tap(action => {
      const { accessToken } = action.payload;
      setAccessTokenInLocalStorage(accessToken);
    }),
  );
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default combineEpics(facebookLoginEpic, storeAccessTokenEpic);
