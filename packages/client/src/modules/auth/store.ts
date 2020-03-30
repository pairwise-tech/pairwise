import { createReducer } from "typesafe-actions";
import * as actions from "./actions";
import { AuthActionTypes } from "./index";

/** ===========================================================================
 * App Store
 * ============================================================================
 */

export interface State {
  emailLoginRequestLoading: boolean;
  accessToken: string;
  singleSignOnDialogOpen: boolean;
  bulkPersistenceInProgress: boolean;
}

const initialState = {
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
    singleSignOnDialogOpen: action.payload,
  }))
  .handleAction(actions.storeAccessTokenSuccess, (state, action) => ({
    ...state,
    singleSignOnDialogOpen: false,
    accessToken: action.payload.accessToken,
  }))
  .handleAction(actions.loginByEmail, state => ({
    ...state,
    emailLoginRequestLoading: true,
  }))
  .handleAction(
    [actions.loginByEmailSuccess, actions.loginByEmailFailure],
    state => ({
      ...state,
      emailLoginRequestLoading: false,
    }),
  );

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default auth;
