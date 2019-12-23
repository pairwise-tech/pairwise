import { createReducer } from "typesafe-actions";

import actions, { ActionTypes } from "./actions";

/** ===========================================================================
 * App Store
 * ============================================================================
 */

export interface State {
  initialized: boolean;
  singleSignOnDialogOpen: boolean;
}

const initialState = {
  initialized: false,
  singleSignOnDialogOpen: false,
};

const app = createReducer<State, ActionTypes>(initialState)
  .handleAction(actions.initializeAppSuccess, state => ({
    ...state,
    initialized: true,
  }))
  .handleAction(actions.setSingleSignOnDialogState, (state, action) => ({
    ...state,
    singleSignOnDialogOpen: action.payload,
  }));

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default app;
