import { HttpResponseError } from "modules/api";
import { createAction } from "typesafe-actions";
import { FeedbackRecord } from "./store";

/** ===========================================================================
 * Action Types
 * ============================================================================
 */

enum ActionTypesEnum {
  FETCH_ALL_FEEDBACK = "FETCH_ALL_FEEDBACK",
  FETCH_ALL_FEEDBACK_SUCCESS = "FETCH_ALL_FEEDBACK_SUCCESS",
  FETCH_ALL_FEEDBACK_FAILURE = "FETCH_ALL_FEEDBACK_FAILURE",
}

/** ===========================================================================
 * Actions
 * ============================================================================
 */

export const fetchAllFeedback = createAction(
  ActionTypesEnum.FETCH_ALL_FEEDBACK,
)();

export const fetchAllFeedbackSuccess = createAction(
  ActionTypesEnum.FETCH_ALL_FEEDBACK_SUCCESS,
)<FeedbackRecord[]>();

export const fetchAllFeedbackFailure = createAction(
  ActionTypesEnum.FETCH_ALL_FEEDBACK_FAILURE,
)<HttpResponseError>();
