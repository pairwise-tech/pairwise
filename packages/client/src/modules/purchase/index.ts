import actions, { ActionTypes } from "./actions";
import epics from "./epics";
import * as selector from "./selectors";
import store, { State } from "./store";

const purchase = {
  actions,
  epics,
  store,
  selector,
};

export type PurchaseState = State;
export type PurchaseActionTypes = ActionTypes;

export default purchase;
