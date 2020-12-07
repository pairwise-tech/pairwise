import * as actions from "./actions";
import epics from "./epics";
import * as selector from "./selectors";
import store, { State } from "./store";
import { ActionType } from "typesafe-actions";

const feedback = {
  actions,
  epics,
  store,
  selector,
};

export type FeedbackState = State;
export type FeedbackActionTypes = ActionType<typeof actions>;

export default feedback;
