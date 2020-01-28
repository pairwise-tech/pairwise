import { createSelector } from "reselect";
import { identity } from "ramda";

import { ReduxStoreState } from "modules/root";

/** ===========================================================================
 * Selectors
 * ============================================================================
 */

export const userState = (state: ReduxStoreState) => {
  return state.user;
};

export const userSelector = createSelector(userState, identity);

export const userProfile = createSelector(userState, state => state.profile);

export const userSettings = createSelector(userState, state => state.settings);

export const userCourses = createSelector(userState, state => state.courses);

export const userPayments = createSelector(userState, state => state.payments);

export const userProgress = createSelector(userState, state => state.progress);

export const editorOptions = createSelector(userState, ({ settings }) => ({
  fontSize: settings.workspaceFontSize,
}));

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default {
  userSelector,
  userProfile,
  userSettings,
  userCourses,
  userPayments,
  userProgress,
  editorOptions,
};
