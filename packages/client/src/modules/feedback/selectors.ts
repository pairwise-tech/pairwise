import { ReduxStoreState } from "modules/root";
import { createSelector } from "reselect";

export const feedbackState = (state: ReduxStoreState) => {
  return state.feedback;
};

export const getFeedbackDialogOpen = createSelector(
  feedbackState,
  state => state.feedbackDialogOpen,
);

export const getFeedback = createSelector(
  feedbackState,
  state => state.feedback,
);

export const getFeedbackType = createSelector(
  feedbackState,
  state => state.feedbackType,
);
