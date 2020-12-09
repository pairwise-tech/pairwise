import * as actions from "./actions";
import epics from "./epics";
import * as selector from "./selectors";
import store, { State } from "./store";
import { ActionType } from "typesafe-actions";

const stats = {
  actions,
  epics,
  store,
  selector,
};

export type StatsState = State;
export type StatsActionTypes = ActionType<typeof actions>;

export default stats;
