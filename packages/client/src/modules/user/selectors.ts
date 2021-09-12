import { createSelector } from "reselect";
import { ReduxStoreState } from "modules/root";
import { UserCourseAccessMap } from "@pairwise/common";

/** ===========================================================================
 * Selectors
 * ============================================================================
 */

export const userState = (state: ReduxStoreState) => {
  return state.user;
};

export const editorOptions = createSelector(userState, (state) => ({
  fontSize: state.user.settings.workspaceFontSize,
}));

export const loading = createSelector(userState, (state) => state.loading);

export const userLeaderboardState = createSelector(
  userState,
  (state) => state.userLeaderboard,
);

export const emailVerificationStatus = createSelector(
  userState,
  (state) => state.emailVerificationStatus,
);

export const userSelector = createSelector(userState, (state) => state.user);

export const userProfile = createSelector(
  userState,
  (state) => state.user.profile,
);

export const userSettings = createSelector(
  userState,
  (state) => state.user.settings,
);

export const isDarkTheme = createSelector(
  userSettings,
  (settings) => settings.appTheme === "dark",
);

export const userCourses = createSelector(
  userState,
  (state) => state.user.courses,
);

export const hasPurchasedTypeScriptCourse = createSelector(
  [userCourses],
  (courses: Nullable<UserCourseAccessMap>) => {
    // Use the hard-coded TS course id...
    const TS_COURSE_ID = "fpvPtfu7s";

    if (courses && TS_COURSE_ID in courses) {
      return true;
    } else {
      return false;
    }
  },
);

export const userPayments = createSelector(
  userState,
  (state) => state.user.payments,
);

export const userProgress = createSelector(
  userState,
  (state) => state.user.progress,
);
