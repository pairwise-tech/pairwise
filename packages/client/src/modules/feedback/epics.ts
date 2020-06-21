import { EpicSignature } from "modules/root";
import { filter, pluck, mergeMap, map } from "rxjs/operators";
import { isActionOf } from "typesafe-actions";
import { Actions } from "modules/root-actions";
import { combineEpics } from "redux-observable";
import { FEEDBACK_DIALOG_TYPES } from "./actions";

/**
 * Submit feedback for a challenge.
 */
const submitUserFeedbackEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.submitUserFeedback)),
    pluck("payload"),
    mergeMap(deps.api.submitUserFeedback),
    map(result => {
      if (result.value) {
        deps.toaster.success("Feedback Submitted Successfully!");
        return Actions.submitUserFeedbackSuccess();
      } else {
        deps.toaster.error("Could not submit feedback!");
        return Actions.submitUserFeedbackFailure(result.error);
      }
    }),
  );
};

/**
 * Submit generic feedback. These messages just get forwarded to
 * our Slack directly.
 */
const submitGenericFeedbackEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.submitGeneralFeedback)),
    pluck("payload"),
    mergeMap(deps.api.submitGenericFeedback),
    map(result => {
      if (result.value) {
        deps.toaster.success("Feedback Submitted Successfully!");
        return Actions.submitGeneralFeedbackSuccess();
      } else {
        deps.toaster.error("Could not submit feedback!");
        return Actions.submitGeneralFeedbackFailure(result.error);
      }
    }),
  );
};

/**
 * Dismiss the feedback modal if any navigation event occurs.
 */
const dismissFeedbackModalOnNavigationEpic: EpicSignature = action$ => {
  return action$.pipe(
    filter(isActionOf(Actions.locationChange)),
    mergeMap(() => {
      // Clear the feedback input and close the modal
      return [
        Actions.setFeedbackState(""),
        Actions.setFeedbackDialogState(FEEDBACK_DIALOG_TYPES.CLOSED),
      ];
    }),
  );
};

export default combineEpics(
  submitUserFeedbackEpic,
  submitGenericFeedbackEpic,
  dismissFeedbackModalOnNavigationEpic,
);
