import { createSelector } from "reselect";
import { ReduxStoreState } from "modules/root";

/** ===========================================================================
 * Selectors
 * ============================================================================
 */

export const usersState = (state: ReduxStoreState) => {
  return state.users;
};

export const allUsersProgressState = (state: ReduxStoreState) => {
  return state.users.allUserProgress;
};

export const loading = createSelector(usersState, (state) => state.loading);
