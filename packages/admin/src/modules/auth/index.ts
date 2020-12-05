import * as actions from "./actions";
import epics from "./epics";
import * as selector from "./selectors";
import store, { State } from "./store";
import { ActionType } from "typesafe-actions";

const auth = {
  actions,
  epics,
  store,
  selector,
};

export type AuthState = State;
export type AuthActionTypes = ActionType<typeof actions>;

export default auth;
