import actions, { ActionTypes } from "./actions";
import epics from "./epics";
import * as selector from "./selectors";
import store, { State } from "./store";

const user = {
  actions,
  epics,
  store,
  selector,
};

export type UserState = State;
export type UserActionTypes = ActionTypes;

export default user;
