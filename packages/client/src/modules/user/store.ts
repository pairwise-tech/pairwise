import { createReducer } from "typesafe-actions";

import { IUserDto } from "@prototype/common";
import { AppActionTypes } from "../app";
import { Actions as actions } from "../root-actions";
import { ActionTypes } from "./actions";

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

const app = createReducer<State, ActionTypes | AppActionTypes>(initialState)
  .handleAction(actions.updateUser, state => state)
  .handleAction(actions.logoutUser, () => initialState)
  .handleAction(actions.fetchUserSuccess, (state, action) => ({
    ...state,
    user: action.payload,
  }));

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default app;
