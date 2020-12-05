import { ReduxStoreState } from "modules/root";
import { createSelector } from "reselect";
import { FEEDBACK_DIALOG_TYPES } from "./actions";

export const feedbackState = (state: ReduxStoreState) => {
  return state.feedback;
};

export const getFeedbackDialogOpen = createSelector(
  feedbackState,
  state => state.feedbackDialogState !== FEEDBACK_DIALOG_TYPES.CLOSED,
);

export const getFeedbackDialogState = createSelector(
  feedbackState,
  state => state.feedbackDialogState,
);

export const getFeedback = createSelector(
  feedbackState,
  state => state.feedback,
);

export const getFeedbackType = createSelector(
  feedbackState,
  state => state.feedbackType,
);
