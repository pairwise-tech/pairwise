import { createReducer } from "typesafe-actions";

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

const app = createReducer<State, ActionTypes>(initialState)
  .handleAction(actions.updateUser, state => state)
  .handleAction(actions.fetchUserSuccess, (state, action) => ({
    ...state,
    user: action.payload,
  }));

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default app;
