import { createReducer } from "typesafe-actions";

import Auth, { AuthActionTypes } from "../auth";
import actions, { ActionTypes } from "./actions";
import { User } from "./types";

/** ===========================================================================
 * App Store
 * ============================================================================
 */

export interface State {
  user: Nullable<User>;
}

const initialState = {
  user: null,
};

const app = createReducer<State, ActionTypes | AuthActionTypes>(initialState)
  .handleAction(actions.updateUser, state => state)
  .handleAction(Auth.actions.facebookLoginSuccess, (state, action) => ({
    ...state,
    user: action.payload.user,
  }));

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default app;
