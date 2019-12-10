import identity from "ramda/es/identity";
import { createSelector } from "reselect";

import { ReduxStoreState } from "modules/root";
import { CURRENT_ACTIVE_CHALLENGE_IDS } from "./epics";

/** ===========================================================================
 * Selectors
 * ============================================================================
 */

export const challengesState = (state: ReduxStoreState) => {
  return state.challenges;
};

export const challengesSelector = createSelector([challengesState], identity);

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
 * Find the module, course, and challenged ids for the first unfinished challenge.
 */
export const firstUnfinishedChallengeMeta = createSelector(
  challengesState,
  challenges => {
    const { currentCourseId, currentModuleId, currentChallengeId } = challenges;

    return {
      currentCourseId,
      currentModuleId,
      currentChallengeId,
    };
  },
);

/**
 * Retrieve the actual challenge data from the first unfinished challenge.
 */
export const firstUnfinishedChallenge = createSelector(
  challengesState,
  firstUnfinishedChallengeMeta,
  (challenges, unfinishedChallengeMeta) => {
    /* TODO: moduleId */
    const { currentCourseId, currentChallengeId } = unfinishedChallengeMeta;

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
  workspaceLoadingSelector,
  currentChallengeSelector,
  firstUnfinishedChallenge,
  firstUnfinishedChallengeMeta,
};
