import { createReducer } from "typesafe-actions";

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
  accessToken: "",
  loadingAuth: false,
  singleSignOnDialogOpen: false,
};

const app = createReducer<State, ActionTypes>(initialState)
  .handleAction(actions.setSingleSignOnDialogState, (state, action) => ({
    ...state,
    singleSignOnDialogOpen: action.payload,
  }))
  .handleAction(actions.storeAccessTokenSuccess, (state, action) => ({
    ...state,
    loadingAuth: false,
    singleSignOnDialogOpen: false,
    accessToken: action.payload.accessToken,
  }))
  .handleAction(actions.facebookLogin, (state, action) => ({
    ...state,
    loadingAuth: true,
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
