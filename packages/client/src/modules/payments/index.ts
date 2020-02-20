import * as actions from "./actions";
import epics from "./epics";
import * as selector from "./selectors";
import store, { State } from "./store";
import { ActionType } from "typesafe-actions";

const payments = {
  actions,
  epics,
  store,
  selector,
};

export type PaymentsState = State;
export type PaymentsActionTypes = ActionType<typeof actions>;

export default payments;
