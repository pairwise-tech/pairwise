import * as actions from "./actions";
import epics from "./epics";
import * as selector from "./selectors";
import store, { State } from "./store";
import { ActionType } from "typesafe-actions";

const purchase = {
  actions,
  epics,
  store,
  selector,
};

export type PurchaseState = State;
export type PurchaseActionTypes = ActionType<typeof actions>;

export default purchase;
