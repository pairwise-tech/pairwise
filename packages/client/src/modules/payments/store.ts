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
  checkoutLoading: boolean;
}

const initialState = {
  paymentIntentCourseId: "",
  stripeCheckoutSessionId: "",
  paymentIntentModalOpen: false,
  paymentSuccessModalOpen: false,
  paymentSuccessCourseId: "",
  checkoutLoading: false,
};

const payments = createReducer<State, PaymentsActionTypes>(initialState)
  .handleAction(actions.setPaymentCourseModalState, (state, action) => ({
    ...state,
    paymentIntentModalOpen: action.payload,
  }))
  .handleAction(actions.startCheckout, (state, action) => ({
    ...state,
    checkoutLoading: true,
  }))
  .handleAction(actions.startCheckoutSuccess, (state, action) => ({
    ...state,
    stripeCheckoutSessionId: action.payload.stripeCheckoutSessionId,
  }))
  .handleAction(
    [actions.redirectToStripeSuccess, actions.redirectToStripeFailure],
    (state) => ({
      ...state,
      checkoutLoading: false,
    }),
  )
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
