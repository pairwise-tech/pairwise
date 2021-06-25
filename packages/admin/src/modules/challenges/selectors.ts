import identity from "ramda/es/identity";
import { createSelector } from "reselect";
import { ReduxStoreState } from "modules/root";

/** ===========================================================================
 * Selectors
 * ============================================================================
 */

export const challengesState = (state: ReduxStoreState) => {
  return state.challenges;
};

export const challengesSelector = createSelector([challengesState], identity);

export const getChallengeMap = createSelector(
  [challengesState],
  state => state.challengeMap,
);

export const challengeDetailId = createSelector(
  [challengesState],
  state => state.challengeDetailId,
);

export const challengeMeta = createSelector(
  [challengesState],
  state => state.challengeMeta,
);

export const navigationOverlayVisible = createSelector(
  [challengesState],
  challenges => challenges.displayNavigationMap,
);

export const menuSelectItemIndex = createSelector(
  [challengesState],
  challenges => challenges.keySelectedMenuItemIndex,
);

export const courseList = createSelector(
  [challengesState],
  challenges => challenges.courses,
);

export const courseSkeletons = createSelector(
  [challengesState],
  challenges => challenges.courseSkeletons,
);

export const getCourseSkeletons = createSelector([challengesState], state => {
  return state.courseSkeletons;
});

// Get an array of course metadata for the current course list
export const courseListMetadata = createSelector([challengesState], state => {
  if (state.courses) {
    return state.courses.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description,
      free: course.free,
      price: course.price,
    }));
  } else {
    return [];
  }
});

export const pullRequestContext = createSelector(
  [challengesState],
  state => state.pullRequestContext,
);

export const pullRequestContextLoading = createSelector(
  [challengesState],
  state => state.pullRequestLoading,
);
