import { createReducer } from "typesafe-actions";
import * as actions from "./actions";
import { PaymentsActionTypes } from "./index";

/** ===========================================================================
 * App Store
 * ============================================================================
 */

export interface State {
  paymentIntentCourseId: string;
  paymentIntentModalOpen: boolean;
  paymentSuccessModalOpen: boolean;
  paymentSuccessCourseId: string;
}

const initialState = {
  paymentIntentCourseId: "",
  stripeCheckoutSessionId: "",
  paymentIntentModalOpen: false,
  paymentSuccessModalOpen: false,
  paymentSuccessCourseId: "",
};

const payments = createReducer<State, PaymentsActionTypes>(initialState)
  .handleAction(actions.setPaymentCourseModalState, (state, action) => ({
    ...state,
    paymentIntentModalOpen: action.payload,
  }))
  .handleAction(actions.startCheckoutSuccess, (state, action) => ({
    ...state,
    stripeCheckoutSessionId: action.payload.stripeCheckoutSessionId,
  }))
  .handleAction(actions.setPaymentSuccess, (state, action) => ({
    ...state,
    paymentSuccessModalOpen: true,
    paymentSuccessCourseId: action.payload.courseId,
  }))
  .handleAction(actions.setPaymentSuccessModalState, (state, action) => ({
    ...state,
    paymentSuccessModalOpen: action.payload,
  }))
  .handleAction(actions.setPaymentCourseId, (state, action) => ({
    ...state,
    paymentIntentCourseId: action.payload.courseId,
  }));

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default payments;
