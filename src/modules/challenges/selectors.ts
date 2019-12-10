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

export const navigationOverlayVisible = createSelector(
  [challengesState],
  challenges => challenges.displayNavigationMap,
);

export const navigationSkeleton = createSelector(
  [challengesState],
  challenges => challenges.navigationSkeleton,
);

export const workspaceLoadingSelector = createSelector(
  [challengesState],
  challenges => {
    return challenges.workspaceLoading;
  },
);

/**
 * Find an return the current selected challenge, if it exists. Return
 * null otherwise.
 */
export const currentChallengeSelector = createSelector(
  [challengesState],
  challenges => {
    const {
      currentCourseId,
      currentChallengeId,
      challengeDictionary,
    } = challenges;

    if (currentCourseId) {
      const challengeList = challengeDictionary.get(currentCourseId);

      if (challengeList) {
        const challenge = challengeList.find(c => c.id === currentChallengeId);

        if (challenge) {
          return challenge;
        }
      }
    }

    return null;
  },
);

/**
 * Retrieve the actual challenge data from the first unfinished challenge.
 */
export const firstUnfinishedChallenge = createSelector(
  challengesState,
  challenges => {
    const { currentCourseId, currentChallengeId } = challenges;

    if (currentCourseId) {
      const challengeList = challenges.challengeDictionary.get(currentCourseId);
      if (challengeList) {
        const challenge = challengeList.find(c => c.id === currentChallengeId);
        if (challenge) {
          return challenge;
        }
      }
    }

    return null;
  },
);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default {
  challengesSelector,
  navigationSkeleton,
  navigationOverlayVisible,
  workspaceLoadingSelector,
  currentChallengeSelector,
  firstUnfinishedChallenge,
};
