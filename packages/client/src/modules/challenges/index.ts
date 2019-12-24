import actions, { ActionTypes } from "./actions";
import epics from "./epics";
import selector from "./selectors";
import store, { State } from "./store";

const challenges = {
  actions,
  epics,
  store,
  selector,
};

export type ChallengesState = State;
export type ChallengesActionTypes = ActionTypes;

export default challenges;
