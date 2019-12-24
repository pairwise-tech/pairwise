import axios from "axios";
import { combineEpics } from "redux-observable";
import { filter, ignoreElements, mergeMap, tap } from "rxjs/operators";
import { isActionOf } from "typesafe-actions";

import { User } from "modules/user/types";
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
    mergeMap(async action => {
      try {
        console.log(action);

        const params = { access_token: action.payload.accessToken };
        const response = await axios.get<{ user: User; accessToken: string }>(
          "http://localhost:9000/auth/facebook",
          { params },
        );

        const { accessToken, user } = response.data;
        return Actions.facebookLoginSuccess({ user, accessToken });
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
    ignoreElements(),
  );
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default combineEpics(facebookLoginEpic, storeAccessTokenEpic);
