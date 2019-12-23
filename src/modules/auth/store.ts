import { createReducer } from "typesafe-actions";

import { getAccessTokenFromLocalStorage } from "tools/utils";
import actions, { ActionTypes } from "./actions";

/** ===========================================================================
 * App Store
 * ============================================================================
 */

export interface State {
  accessToken: string;
  loadingAuth: boolean;
  singleSignOnDialogOpen: boolean;
}

const initialState = {
  loadingAuth: false,
  singleSignOnDialogOpen: false,
  accessToken: getAccessTokenFromLocalStorage(),
};

const app = createReducer<State, ActionTypes>(initialState)
  .handleAction(actions.setSingleSignOnDialogState, (state, action) => ({
    ...state,
    singleSignOnDialogOpen: action.payload,
  }))
  .handleAction(actions.facebookLogin, (state, action) => ({
    ...state,
    loadingAuth: true,
  }))
  .handleAction(actions.facebookLoginSuccess, (state, action) => ({
    ...state,
    loadingAuth: false,
    singleSignOnDialogOpen: false,
    accessToken: action.payload.accessToken,
  }))
  .handleAction(actions.facebookLoginFailure, (state, action) => ({
    ...state,
    loadingAuth: false,
  }));

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default app;
