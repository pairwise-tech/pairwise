import { createSelector } from "reselect";
import { ReduxStoreState } from "modules/root";

/** ===========================================================================
 * Selectors
 * ============================================================================
 */

export const userState = (state: ReduxStoreState) => {
  return state.user;
};

export const editorOptions = createSelector(userState, state => ({
  fontSize: state.user.settings.workspaceFontSize,
}));

export const loading = createSelector(userState, state => state.loading);

export const emailVerificationStatus = createSelector(
  userState,
  state => state.emailVerificationStatus,
);

export const userSelector = createSelector(userState, state => state.user);

export const userProfile = createSelector(
  userState,
  state => state.user.profile,
);

export const userSettings = createSelector(
  userState,
  state => state.user.settings,
);

export const userCourses = createSelector(
  userState,
  state => state.user.courses,
);

export const userPayments = createSelector(
  userState,
  state => state.user.payments,
);

export const userProgress = createSelector(
  userState,
  state => state.user.progress,
);
