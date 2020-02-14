import { createReducer } from "typesafe-actions";
import * as actions from "./actions";
import { PaymentsActionTypes } from "./index";

/** ===========================================================================
 * App Store
 * ============================================================================
 */

export interface State {
  accessToken: string;
  paymentCourseId: string;
  paymentCourseModalOpen: boolean;
}

const initialState = {
  accessToken: "",
  paymentCourseId: "",
  stripeCheckoutSessionId: "",
  paymentCourseModalOpen: false,
};

const payments = createReducer<State, PaymentsActionTypes>(initialState)
  .handleAction(actions.setPurchaseCourseModalState, (state, action) => ({
    ...state,
    paymentCourseModalOpen: action.payload,
  }))
  .handleAction(actions.startCheckoutSuccess, (state, action) => ({
    ...state,
    stripeCheckoutSessionId: action.payload.stripeCheckoutSessionId,
  }))
  .handleAction(actions.setPurchaseCourseId, (state, action) => ({
    ...state,
    paymentCourseId: action.payload.courseId,
  }));

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default payments;
