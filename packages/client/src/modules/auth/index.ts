import actions, { ActionTypes } from "./actions";
import epics from "./epics";
import selector from "./selectors";
import store, { State } from "./store";

const auth = {
  actions,
  epics,
  store,
  selector,
};

export type AuthState = State;
export type AuthActionTypes = ActionTypes;

export default auth;
