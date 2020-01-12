import { createReducer } from "typesafe-actions";

import { IUserDto } from "@pairwise/common";
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
  .handleAction(actions.logoutUser, () => initialState)
  .handleAction(
    [actions.fetchUserSuccess, actions.updateUserSuccess],
    (state, action) => ({
      ...state,
      user: action.payload,
    }),
  );

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default app;
