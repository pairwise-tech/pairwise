import { createSelector } from "reselect";
import { ReduxStoreState } from "modules/root";

/** ===========================================================================
 * Selectors
 * ============================================================================
 */

export const adminUserState = (state: ReduxStoreState) => {
  return state.admin;
};

export const editorOptions = createSelector(adminUserState, state => ({
  fontSize: state.user.settings.workspaceFontSize,
}));

export const loading = createSelector(adminUserState, state => state.loading);

export const emailVerificationStatus = createSelector(
  adminUserState,
  state => state.emailVerificationStatus,
);

export const adminUserSelector = createSelector(adminUserState, state => state.user);

export const adminUserProfile = createSelector(
  adminUserState,
  state => state.user.profile,
);

export const adminUserSettings = createSelector(
  adminUserState,
  state => state.user.settings,
);

export const adminUserCourses = createSelector(
  adminUserState,
  state => state.user.courses,
);

export const adminUserPayments = createSelector(
  adminUserState,
  state => state.user.payments,
);

export const adminUserProgress = createSelector(
  adminUserState,
  state => state.user.progress,
);
