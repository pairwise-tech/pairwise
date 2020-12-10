import { createReducer } from "typesafe-actions";
import * as actions from "./actions";
import { StatsActionTypes } from "./index";

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
  loading: boolean;
  progressRecords: Nullable<ProgressRecords>;
}

const initialState = {
  loading: true,
  progressRecords: null,
};

const stats = createReducer<State, StatsActionTypes>(initialState)
  .handleAction(actions.fetchProgressRecordsSuccess, (state, action) => ({
    ...state,
    loading: false,
    progressRecords: action.payload,
  }))
  .handleAction(
    [actions.refreshStats, actions.fetchProgressRecords],
    (state, action) => ({
      ...state,
      loading: true,
    }),
  );

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default stats;
