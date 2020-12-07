import { createReducer } from "typesafe-actions";
import * as actions from "./actions";
import { RealtimeActionTypes } from "./index";

/** ===========================================================================
 * App Store
 * ============================================================================
 */

export interface ProgressRecord {
  user: string;
  challenges: string[];
}

export interface ProgressRecords {
  status: string;
  records: ProgressRecord[];
}

export interface State {
  progressRecords: Nullable<ProgressRecords>;
}

const initialState = {
  progressRecords: null,
};

const auth = createReducer<State, RealtimeActionTypes>(
  initialState,
).handleAction(actions.fetchProgressRecordsSuccess, (state, action) => ({
  ...state,
  progressRecords: action.payload,
}));

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default auth;
