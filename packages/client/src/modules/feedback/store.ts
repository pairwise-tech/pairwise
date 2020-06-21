import { FEEDBACK_TYPE } from "@pairwise/common";
import { createReducer } from "typesafe-actions";
import { AppActionTypes } from "modules/app";
import { FeedbackActionTypes } from ".";
import * as actions from "./actions";

export interface State {
  feedback?: string;
  feedbackType: Nullable<FEEDBACK_TYPE>;
  feedbackDialogState: actions.FEEDBACK_DIALOG_TYPES;
}

const initialState = {
  feedback: undefined,
  feedbackType: null,
  feedbackDialogState: actions.FEEDBACK_DIALOG_TYPES.CLOSED,
};

const feedback = createReducer<State, FeedbackActionTypes | AppActionTypes>(
  initialState,
)
  .handleAction(actions.setFeedbackDialogState, (state, action) => ({
    ...state,
    feedbackDialogState: action.payload,
  }))
  .handleAction(actions.setFeedbackState, (state, action) => ({
    ...state,
    feedback: action.payload,
  }))
  .handleAction(actions.submitUserFeedbackSuccess, (state, action) => ({
    ...state,
    feedback: undefined,
    feedbackType: null,
  }))
  .handleAction(actions.setFeedbackType, (state, action) => ({
    ...state,
    feedbackType: action.payload,
  }));

export default feedback;
