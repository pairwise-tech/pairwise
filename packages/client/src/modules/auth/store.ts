import { createReducer } from "typesafe-actions";

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
  accessToken: "",
  singleSignOnDialogOpen: false,
};

const app = createReducer<State, ActionTypes>(initialState)
  .handleAction(actions.setSingleSignOnDialogState, (state, action) => ({
    ...state,
    singleSignOnDialogOpen: action.payload,
  }))
  .handleAction(actions.storeAccessTokenSuccess, (state, action) => ({
    ...state,
    singleSignOnDialogOpen: false,
    accessToken: action.payload.accessToken,
  }));

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default app;
