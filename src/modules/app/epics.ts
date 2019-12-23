import axios from "axios";
import { combineEpics } from "redux-observable";
import { filter, map, mergeMap } from "rxjs/operators";
import { isActionOf } from "typesafe-actions";

import { EpicSignature } from "../root";
import { Actions } from "../root-actions";

/** ===========================================================================
 * Epics
 * ============================================================================
 */

const appInitializationEpic: EpicSignature = action$ => {
  return action$.pipe(
    filter(isActionOf(Actions.initializeApp)),
    map(() => Actions.initializeAppSuccess()),
  );
};

const facebookLoginEpic: EpicSignature = action$ => {
  return action$.pipe(
    filter(isActionOf(Actions.facebookLogin)),
    mergeMap(async response => {
      try {
        console.log("Received FB response!");
        console.log(response);
        const authResponse = await axios.get(
          "http://localhost:8080/auth/facebook",
          {
            params: { access_token: response.payload.accessToken },
          },
        );
        console.log(authResponse);
        return Actions.facebookLoginSuccess();
      } catch (err) {
        console.log(err);
        return Actions.facebookLoginFailure();
      }
    }),
  );
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default combineEpics(appInitializationEpic, facebookLoginEpic);
