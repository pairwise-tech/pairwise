import { createSelector } from "reselect";
import { ReduxStoreState } from "modules/root";

/** ===========================================================================
 * Selectors
 * ============================================================================
 */

export const statsState = (state: ReduxStoreState) => {
  return state.stats;
};

export const progressRecordsSelector = createSelector(
  [statsState],
  (x) => x.progressRecords,
);

export const progressRecordsLastUpdatedSelector = createSelector(
  [statsState],
  (x) => x.progressRecordsLastUpdated,
);

export const statsLoadingSelector = createSelector(
  [statsState],
  (x) => x.loading,
);
