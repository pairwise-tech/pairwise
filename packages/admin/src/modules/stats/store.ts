import { createReducer } from "typesafe-actions";
import { RecentProgressAdminDto } from "@pairwise/common";
import * as actions from "./actions";
import { StatsActionTypes } from "./index";

/** ===========================================================================
 * App Store
 * ============================================================================
 */

export interface State {
  loading: boolean;
  progressRecords: Nullable<RecentProgressAdminDto>;
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
  .handleAction(actions.fetchProgressRecords, (state, action) => ({
    ...state,
    loading: true,
  }))
  .handleAction([actions.refreshStats], (state, action) => ({
    ...state,
    loading: action.payload.disableLoadingState ? state.loading : true,
  }));

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default stats;
