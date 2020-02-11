import { EpicSignature } from "modules/root";
import { filter, pluck, mergeMap, map } from "rxjs/operators";
import { isActionOf } from "typesafe-actions";
import { Actions } from "modules/root-actions";
import { combineEpics } from "redux-observable";

const submitUserFeedbackEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.submitUserFeedback)),
    pluck("payload"),
    mergeMap(deps.api.submitUserFeedback),
    map(result => {
      if (result.value) {
        deps.toaster.show({
          message: "Feedback Submitted Successfully!",
          intent: "success",
          icon: "tick",
        });
        return Actions.submitUserFeedbackSuccess();
      } else {
        deps.toaster.show({
          message: "Could not submit feedback!",
          intent: "danger",
          icon: "error",
        });
        return Actions.submitUserFeedbackFailure(result.error);
      }
    }),
  );
};

export default combineEpics(submitUserFeedbackEpic);
