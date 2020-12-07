import * as actions from "./actions";
import epics from "./epics";
import * as selector from "./selectors";
import store, { State } from "./store";
import { ActionType } from "typesafe-actions";

const realtime = {
  actions,
  epics,
  store,
  selector,
};

export type RealtimeState = State;
export type RealtimeActionTypes = ActionType<typeof actions>;

export default realtime;
