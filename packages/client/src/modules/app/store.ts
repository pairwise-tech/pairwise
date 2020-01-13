import { createReducer } from "typesafe-actions";

import actions, { ActionTypes } from "./actions";

/** ===========================================================================
 * App Store
 * ============================================================================
 */

export interface State {
  initialized: boolean;
  location: string;
  purchaseCourseModalOpen: boolean;
}

const initialState = {
  initialized: false,
  location: "",
  purchaseCourseModalOpen: false,
};

const app = createReducer<State, ActionTypes>(initialState)
  .handleAction(actions.initializeAppSuccess, state => ({
    ...state,
    initialized: true,
  }))
  .handleAction(actions.setPurchaseCourseModalState, (state, action) => ({
    ...state,
    purchaseCourseModalOpen: action.payload,
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
