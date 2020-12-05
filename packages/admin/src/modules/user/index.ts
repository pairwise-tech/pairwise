import * as actions from "./actions";
import epics from "./epics";
import * as selector from "./selectors";
import store, { State } from "./store";
import { ActionType } from "typesafe-actions";

const user = {
  actions,
  epics,
  store,
  selector,
};

export type UserState = State;
export type UserActionTypes = ActionType<typeof actions>;

export default user;
