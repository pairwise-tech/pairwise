import { HttpResponseError } from "modules/api";
import { createAction } from "typesafe-actions";
import { PaymentRecord } from "./store";

/** ===========================================================================
 * Action Types
 * ============================================================================
 */

enum ActionTypesEnum {
  FETCH_ALL_PAYMENTS = "FETCH_ALL_PAYMENTS",
  FETCH_ALL_PAYMENTS_SUCCESS = "FETCH_ALL_PAYMENTS_SUCCESS",
  FETCH_ALL_PAYMENTS_FAILURE = "FETCH_ALL_PAYMENTS_FAILURE",
}

/** ===========================================================================
 * Actions
 * ============================================================================
 */

export const fetchAllPayments = createAction(
  ActionTypesEnum.FETCH_ALL_PAYMENTS,
)();

export const fetchAllPaymentsSuccess = createAction(
  ActionTypesEnum.FETCH_ALL_PAYMENTS_SUCCESS,
)<PaymentRecord[]>();

export const fetchAllPaymentsFailure = createAction(
  ActionTypesEnum.FETCH_ALL_PAYMENTS_FAILURE,
)<HttpResponseError>();
