import { createReducer } from "typesafe-actions";
import * as actions from "./actions";
import { AuthActionTypes } from "./index";

/** ===========================================================================
 * App Store
 * ============================================================================
 */

export interface State {
  accessToken: string;
}

const initialState = {
  accessToken: "",
};

const auth = createReducer<State, AuthActionTypes>(initialState)
  .handleAction(actions.storeAccessTokenSuccess, (state, action) => ({
    ...state,
    accessToken: action.payload.accessToken,
  }))
  .handleAction(actions.logoutUser, (state, action) => initialState);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default auth;
