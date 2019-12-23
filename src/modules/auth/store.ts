import { createReducer } from "typesafe-actions";

import { getAccessTokenFromLocalStorage } from "tools/utils";
import actions, { ActionTypes } from "./actions";

/** ===========================================================================
 * App Store
 * ============================================================================
 */

export interface State {
  accessToken: string;
  singleSignOnDialogOpen: boolean;
}

const initialState = {
  singleSignOnDialogOpen: false,
  accessToken: getAccessTokenFromLocalStorage(),
};

const app = createReducer<State, ActionTypes>(initialState)
  .handleAction(actions.setSingleSignOnDialogState, (state, action) => ({
    ...state,
    singleSignOnDialogOpen: action.payload,
  }))
  .handleAction(actions.facebookLoginSuccess, (state, action) => ({
    ...state,
    singleSignOnDialogOpen: false,
    accessToken: action.payload.accessToken,
  }));

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default app;
