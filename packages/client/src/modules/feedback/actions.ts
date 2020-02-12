import { createAction } from "typesafe-actions";
import { FEEDBACK_TYPE, IFeedbackDto } from "@pairwise/common";
import { HttpResponseError } from "modules/api";

enum ActionTypesEnum {
  SET_FEEDBACK_DIALOG_STATE = "SET_FEEDBACK_DIALOG_STATE",
  SET_FEEDBACK_STATE = "SET_FEEDBACK_STATE",
  SET_FEEDBACK_TYPE = "SET_FEEDBACK_TYPE",
  SUBMIT_USER_FEEDBACK = "SUBMIT_USER_FEEDBACK",
  SUBMIT_USER_FEEDBACK_SUCCESS = "SUBMIT_USER_FEEDBACK_SUCCESS",
  SUBMIT_USER_FEEDBACK_FAILURE = "SUBMIT_USER_FEEDBACK_FAILURE",
}

export const setFeedbackDialogState = createAction(
  ActionTypesEnum.SET_FEEDBACK_DIALOG_STATE,
)<boolean>();

export const setFeedbackState = createAction(
  ActionTypesEnum.SET_FEEDBACK_STATE,
)<string>();

export const setFeedbackType = createAction(ActionTypesEnum.SET_FEEDBACK_TYPE)<
  FEEDBACK_TYPE
>();

export const submitUserFeedback = createAction(
  ActionTypesEnum.SUBMIT_USER_FEEDBACK,
)<IFeedbackDto>();

export const submitUserFeedbackSuccess = createAction(
  ActionTypesEnum.SUBMIT_USER_FEEDBACK_SUCCESS,
)();

export const submitUserFeedbackFailure = createAction(
  ActionTypesEnum.SUBMIT_USER_FEEDBACK_FAILURE,
)<HttpResponseError>();
