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
