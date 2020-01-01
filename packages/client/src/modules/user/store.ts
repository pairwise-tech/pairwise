import { createReducer } from "typesafe-actions";

import { IUserDto } from "@prototype/common";
import actions, { ActionTypes } from "./actions";

/** ===========================================================================
 * App Store
 * ============================================================================
 */

export interface State {
  user: Nullable<IUserDto>;
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
