import { createReducer } from "typesafe-actions";
import * as actions from "./actions";
import { AuthActionTypes } from "./index";

/** ===========================================================================
 * App Store
 * ============================================================================
 */

export interface State {
  emailRequestSent: boolean;
  emailLoginRequestLoading: boolean;
  accessToken: string;
  singleSignOnDialogOpen: boolean;
  bulkPersistenceInProgress: boolean;
}

const initialState = {
  emailRequestSent: false,
  accessToken: "",
  singleSignOnDialogOpen: false,
  bulkPersistenceInProgress: false,
  emailLoginRequestLoading: false,
};

const auth = createReducer<State, AuthActionTypes>(initialState)
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
    emailRequestSent: false,
    singleSignOnDialogOpen: action.payload,
  }))
  .handleAction(actions.storeAccessTokenSuccess, (state, action) => ({
    ...state,
    accessToken: action.payload.accessToken,
  }))
  .handleAction(actions.loginByEmail, state => ({
    ...state,
    emailRequestSent: false,
    emailLoginRequestLoading: true,
  }))
  .handleAction(actions.loginByEmailSuccess, state => ({
    ...state,
    emailRequestSent: true,
    emailLoginRequestLoading: false,
  }))
  .handleAction(actions.loginByEmailFailure, state => ({
    ...state,
    emailLoginRequestLoading: false,
  }))
  .handleAction(actions.logoutUser, (state, action) => initialState);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default auth;
