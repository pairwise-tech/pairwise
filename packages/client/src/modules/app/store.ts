import { createReducer } from "typesafe-actions";

import actions, { ActionTypes } from "./actions";

/** ===========================================================================
 * App Store
 * ============================================================================
 */

export interface State {
  initialized: boolean;
}

const initialState = {
  initialized: false,
};

const app = createReducer<State, ActionTypes>(initialState).handleAction(
  actions.initializeAppSuccess,
  state => ({
    ...state,
    initialized: true,
  }),
);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default app;
