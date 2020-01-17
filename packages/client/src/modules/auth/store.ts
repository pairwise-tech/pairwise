import { createReducer } from "typesafe-actions";

import actions, { ActionTypes } from "./actions";

/** ===========================================================================
 * App Store
 * ============================================================================
 */

export interface State {
  accessToken: string;
  singleSignOnDialogOpen: boolean;
  bulkPersistenceInProgress: boolean;
}

const initialState = {
  accessToken: "",
  singleSignOnDialogOpen: false,
  bulkPersistenceInProgress: false,
};

const auth = createReducer<State, ActionTypes>(initialState)
  .handleAction(actions.initiateBulkPersistence, (state, action) => ({
    ...state,
    bulkPersistenceInProgress: true,
  }))
  .handleAction(actions.bulkPersistenceComplete, (state, action) => ({
    ...state,
    bulkPersistenceInProgress: false,
  }))
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

export default auth;
