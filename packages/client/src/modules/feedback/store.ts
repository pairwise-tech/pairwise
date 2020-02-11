import { FEEDBACK_TYPE } from "@pairwise/common";
import { createReducer } from "typesafe-actions";
import { AppActionTypes } from "modules/app";
import { FeedbackActionTypes } from ".";
import * as actions from "./actions";

export interface State {
  feedback?: string;
  feedbackType: Nullable<FEEDBACK_TYPE>;
  feedbackDialogOpen: boolean;
}

const initialState = {
  feedback: undefined,
  feedbackType: null,
  feedbackDialogOpen: false,
};

const feedback = createReducer<State, FeedbackActionTypes | AppActionTypes>(
  initialState,
)
  .handleAction(actions.setFeedbackDialogState, (state, action) => ({
    ...state,
    feedbackDialogOpen: action.payload,
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
