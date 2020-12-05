import * as actions from "./actions";
import epics from "./epics";
import * as selector from "./selectors";
import store, { State } from "./store";
import { ActionType } from "typesafe-actions";

const challenges = {
  actions,
  epics,
  store,
  selector,
};

export type ChallengesState = State;
export type ChallengesActionTypes = ActionType<typeof actions>;

export default challenges;
