import { createReducer } from "typesafe-actions";
import * as actions from "./actions";
import { PaymentsActionTypes } from "./index";

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
  stripeCheckoutSessionId: "",
  purchaseCourseModalOpen: false,
};

const payments = createReducer<State, PaymentsActionTypes>(initialState)
  .handleAction(actions.setPurchaseCourseModalState, (state, action) => ({
    ...state,
    purchaseCourseModalOpen: action.payload,
  }))
  .handleAction(actions.startCheckoutSuccess, (state, action) => ({
    ...state,
    stripeCheckoutSessionId: action.payload.stripeCheckoutSessionId,
  }))
  .handleAction(actions.setPurchaseCourseId, (state, action) => ({
    ...state,
    purchaseCourseId: action.payload.courseId,
  }));

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default payments;
