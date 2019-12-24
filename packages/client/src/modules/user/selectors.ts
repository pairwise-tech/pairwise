import { createSelector } from "reselect";

import { ReduxStoreState } from "modules/root";

/** ===========================================================================
 * Selectors
 * ============================================================================
 */

export const userState = (state: ReduxStoreState) => {
  return state.user;
};

export const userSelector = createSelector(userState, state => state.user);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default {
  userSelector,
};
