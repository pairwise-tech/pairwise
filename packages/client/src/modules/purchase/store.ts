import { createReducer } from "typesafe-actions";

import actions, { ActionTypes } from "./actions";

/** ===========================================================================
 * App Store
 * ============================================================================
 */

export interface State {
  accessToken: string;
  purchaseCourseId: string;
  purchaseCourseModalOpen: boolean;
}

const initialState = {
  accessToken: "",
  purchaseCourseId: "",
  purchaseCourseModalOpen: false,
};

const app = createReducer<State, ActionTypes>(initialState)
  .handleAction(actions.setPurchaseCourseModalState, (state, action) => ({
    ...state,
    purchaseCourseModalOpen: action.payload,
  }))
  .handleAction(actions.setPurchaseCourseId, (state, action) => ({
    ...state,
    purchaseCourseId: action.payload,
  }));

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default app;
