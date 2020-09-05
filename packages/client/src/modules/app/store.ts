import { createReducer } from "typesafe-actions";
import * as actions from "./actions";
import { AppActionTypes } from "./index";

/** ===========================================================================
 * App Store
 * ============================================================================
 */

export interface State {
  initialized: boolean;
  location: string;
  initializationError: boolean;
}

const initialState = {
  initialized: false,
  location: "",
  initializationError: false,
};

const app = createReducer<State, AppActionTypes>(initialState)
  .handleAction(actions.initializeAppSuccess, state => ({
    ...state,
    initialized: true,
  }))
  .handleAction(actions.appInitializationFailed, state => ({
    ...state,
    initializationError: true,
  }))
  .handleAction(actions.locationChange, (state, action) => ({
    ...state,
    location: action.payload.pathname,
  }));

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default app;
