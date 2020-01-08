import identity from "ramda/es/identity";
import { createSelector } from "reselect";

import { CourseList } from "@pairwise/common";
import { ReduxStoreState } from "modules/root";
import prop from "ramda/es/prop";
import { SANDBOX_ID } from "tools/constants";

/** ===========================================================================
 * Selectors
 * ============================================================================
 */

export const challengesState = (state: ReduxStoreState) => {
  return state.challenges;
};

export const challengesSelector = createSelector([challengesState], identity);

export const isEditMode = createSelector([challengesState], prop("isEditMode"));

export const getChallengeMap = createSelector(
  [challengesState],
  state => state.challengeMap,
);

export const getCurrentModuleId = createSelector(
  [challengesState],
  prop("currentModuleId"),
);

export const getCurrentChallengeId = createSelector(
  [challengesState],
  prop("currentChallengeId"),
);

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

export const getCurrentCourse = createSelector([challengesState], state => {
  return state.courses?.find(x => x.id === state.currentCourseId);
});

export const getCurrentModule = createSelector(
  [getCurrentCourse, getCurrentModuleId],
  (course, moduleId) => {
    return course?.modules.find(x => x.id === moduleId);
  },
);

/**
 * NOTE: This getter does not depend on the current course id or module id. This
 * is important. This will find the full challenge data for the challenge with
 * state.currentCHallengeId. In other words, currentCourseId and
 * currentModuleId do not necessarily need to be the course and module for the
 * challenge with currentChallengeId.
 *
 * This allows the nav to be used on top of the current challenge workspace
 * without changing it every time the user clicks a new module.
 */
export const getCurrentChallenge = createSelector(
  [getChallengeMap, getCurrentChallengeId, challengesState],
  (challengeMap, challengeId, state) => {
    // Just a type asserton to de-nullify
    if (!challengeId) {
      return null;
    }

    // The special case. When the user is in the sandbox.
    if (challengeId === SANDBOX_ID) {
      return state.sandboxChallenge;
    }

    // The standard case, where the challengeId belongs to one of the challenges
    // in the course
    const courseId = challengeMap?.[challengeId]?.courseId;
    const moduleId = challengeMap?.[challengeId]?.moduleId;

    return state.courses
      ?.find(x => x.id === courseId)
      ?.modules?.find(x => x.id === moduleId)
      ?.challenges.find(x => x.id === challengeId);
  },
);

export const getCurrentChallengeTestCode = createSelector(
  [getCurrentChallenge],
  c => c?.testCode,
);

export const getCurrentTitle = createSelector(
  [getCurrentChallenge],
  challenge => challenge?.title,
);

export const getCurrentId = createSelector(
  [getCurrentChallenge],
  challenge => challenge?.id,
);

export const getCurrentContent = createSelector(
  [getCurrentChallenge],
  challenge => challenge?.content,
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
