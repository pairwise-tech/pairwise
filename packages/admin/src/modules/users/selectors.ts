import { createSelector } from "reselect";
import { ReduxStoreState } from "modules/root";

/** ===========================================================================
 * Selectors
 * ============================================================================
 */

export const usersState = (state: ReduxStoreState) => {
  return state.users;
};

export const userProgressDistribution = (state: ReduxStoreState) => {
  return state.users.allUserProgress.userProgressDistribution;
};

export const globalChallengeProgressSeries = (state: ReduxStoreState) => {
  return state.users.allUserProgress.globalChallengeProgressSeries;
};

export const loading = createSelector(usersState, (state) => state.loading);
