import { createSelector } from "reselect";
import { ReduxStoreState } from "modules/root";

/** ===========================================================================
 * Selectors
 * ============================================================================
 */

export const realtimeState = (state: ReduxStoreState) => {
  return state.realtime;
};

export const progressRecordsSelector = createSelector(
  [realtimeState],
  x => x.progressRecords,
);
