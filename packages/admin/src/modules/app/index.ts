import * as actions from "./actions";
import epics from "./epics";
import * as selector from "./selectors";
import store, { State } from "./store";
import { ActionType } from "typesafe-actions";

const app = {
  actions,
  epics,
  store,
  selector,
};

export type AppState = State;
export type AppActionTypes = ActionType<typeof actions>;

export default app;
