import { createSelector } from "reselect";
import { ReduxStoreState } from "modules/root";

/** ===========================================================================
 * Selectors
 * ============================================================================
 */

export const feedbackState = (state: ReduxStoreState) => {
  return state.feedback;
};

export const feedbackRecordsSelector = createSelector(
  [feedbackState],
  (x) => x.feedbackRecords,
);
