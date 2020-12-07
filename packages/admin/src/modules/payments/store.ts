import { createReducer } from "typesafe-actions";
import * as actions from "./actions";
import { PaymentsActionTypes } from "./index";
import { Payment } from "@pairwise/common";

/** ===========================================================================
 * App Store
 * ============================================================================
 */

export interface PaymentRecord extends Payment {
  uuid: string;
  createdAt: string;
  updatedAt: string;
}

export interface State {
  paymentRecords: any[];
}

const initialState = {
  paymentRecords: [],
};

const payments = createReducer<State, PaymentsActionTypes>(
  initialState,
).handleAction(actions.fetchAllPaymentsSuccess, (state, action) => ({
  ...state,
  paymentRecords: action.payload,
}));

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default payments;
