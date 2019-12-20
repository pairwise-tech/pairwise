import identity from "ramda/es/identity";
import { createSelector } from "reselect";

import { ReduxStoreState } from "modules/root";
import { CourseList } from "./types";

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

export const courseList = createSelector(
  [challengesState],
  challenges => challenges.courses,
);

export const workspaceLoadingSelector = createSelector(
  [challengesState],
  challenges => {
    return challenges.workspaceLoading;
  },
);

const findCourseById = (courseId: string, courses: CourseList) => {
  const course = courses.find(c => c.id === courseId);
  return course;
};

/**
 * Find an return the current selected challenge, if it exists. Return
 * null otherwise.
 */
export const currentChallengeSelector = createSelector(
  [challengesState],
  challenges => {
    const { currentCourseId, currentChallengeId } = challenges;

    if (currentCourseId && currentChallengeId && challenges.courses) {
      const challengeList = findCourseById(
        currentChallengeId,
        challenges.courses,
      );

      if (challengeList) {
        const challenge = challengeList.modules.find(
          c => c.id === currentChallengeId,
        );

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

    if (currentCourseId && currentChallengeId && challenges.courses) {
      const course = findCourseById(currentCourseId, challenges.courses);
      if (course) {
        for (const courseModule of course.modules) {
          for (const challenge of courseModule.challenges) {
            if (challenge.id === currentChallengeId) {
              return challenge;
            }
          }
        }
      }
    }

    return null;
  },
);

/**
 * Retrieve the next and previous challenge for a given challenge.
 */
export const nextPrevChallenges = createSelector(
  challengesState,
  challenges => {
    let next;
    let prev;
    const { currentCourseId, currentChallengeId } = challenges;

    if (currentCourseId && currentChallengeId && challenges.courses) {
      const course = findCourseById(currentCourseId, challenges.courses);

      if (course) {
        for (const courseModule of course.modules) {
          const moduleChallenges = courseModule.challenges;
          for (let i = 0; i < moduleChallenges.length; i++) {
            if (moduleChallenges[i].id === currentChallengeId) {
              prev = moduleChallenges[i - 1];
              next = moduleChallenges[i + 1];
              return { next, prev };
            }
          }
        }
      }
    }

    return { next, prev };
  },
);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default {
  courseList,
  challengesSelector,
  nextPrevChallenges,
  navigationOverlayVisible,
  workspaceLoadingSelector,
  currentChallengeSelector,
  firstUnfinishedChallenge,
};
