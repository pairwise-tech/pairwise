import identity from "ramda/es/identity";
import { createSelector } from "reselect";
import { ReduxStoreState } from "modules/root";
import prop from "ramda/es/prop";
import { findCourseById } from "tools/utils";
import { adminUserProgress } from "modules/admin/selectors";

/** ===========================================================================
 * Selectors
 * ============================================================================
 */

export const challengesState = (state: ReduxStoreState) => {
  return state.challenges;
};

export const challengesSelector = createSelector([challengesState], identity);

export const isDirty = createSelector([challengesState], prop("isDirty"));

export const getChallengeMap = createSelector(
  [challengesState],
  state => state.challengeMap,
);

export const getCurrentCourseId = createSelector(
  [challengesState],
  prop("currentCourseId"),
);

export const getCurrentModuleId = createSelector(
  [challengesState],
  prop("currentModuleId"),
);

export const getCurrentChallengeId = createSelector(
  [challengesState],
  prop("currentChallengeId"),
);

export const getCurrentActiveIds = createSelector(
  [getCurrentCourseId, getCurrentModuleId, getCurrentChallengeId],
  (currentCourseId, currentModuleId, currentChallengeId) => {
    return {
      currentCourseId,
      currentModuleId,
      currentChallengeId,
    };
  },
);

export const courseList = createSelector(
  [challengesState],
  challenges => challenges.courses,
);

export const courseSkeletons = createSelector(
  [challengesState],
  challenges => challenges.courseSkeletons,
);

export const workspaceLoadingSelector = createSelector(
  [challengesState],
  challenges => {
    return challenges.workspaceLoading;
  },
);

export const getCurrentCourse = createSelector([challengesState], state => {
  return state.courses?.find(x => x.id === state.currentCourseId);
});

export const getCurrentCourseSkeleton = createSelector(
  [challengesState, getCurrentCourseId],
  (challenges, courseId) => {
    return challenges.courseSkeletons?.find(x => x.id === courseId);
  },
);

export const getCourseSkeletons = createSelector([challengesState], state => {
  return state.courseSkeletons;
});

export const getCurrentModule = createSelector(
  [getCurrentCourseSkeleton, getCurrentModuleId],
  (course, moduleId) => {
    return course?.modules.find(x => x.id === moduleId);
  },
);

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

/**
 * Determine if the user has completed the current challenge.
 */
export const isCurrentChallengeComplete = createSelector(
  [getCurrentActiveIds, adminUserProgress],
  (activeIds, userProgressState) => {
    const { currentCourseId, currentChallengeId } = activeIds;
    if (userProgressState && currentCourseId && currentChallengeId) {
      const courseProgress = userProgressState[currentCourseId];
      if (courseProgress) {
        const challengeStatus = courseProgress[currentChallengeId];
        if (challengeStatus) {
          return challengeStatus.complete;
        }
      }
    }

    // Any problems above default to false
    return false;
  },
);

/**
 * Determine if the current challenge is in the Testing & Automation module,
 * using that module's current id.
 */
export const isTestingAndAutomationChallenge = createSelector(
  getCurrentModuleId,
  id => {
    const TESTING_AND_AUTOMATION_MODULE_ID = "ZzVuDVNP";
    if (id && id === TESTING_AND_AUTOMATION_MODULE_ID) {
      return true;
    } else {
      return false;
    }
  },
);

/**
 * Determine if the current challenge is in the Mobile Development module
 * using that module's current id and the hard-coded module id for the
 * React Native challenges.
 */
export const isReactNativeChallenge = createSelector(
  [getChallengeMap, getCurrentChallengeId],
  (challengeMap, challengeId) => {
    if (challengeMap && challengeId) {
      const challenge = challengeMap[challengeId];
      if (challenge) {
        const REACT_NATIVE_MODULE_ID = "D1JR2EXa";
        return challenge.moduleId === REACT_NATIVE_MODULE_ID;
      }
    }

    return false;
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
 * NOTE: A mapping of id to next/prev could be built up immediately after the
 * course is fetched. That's probably an over-optimization though so this will due
 * until it won't.
 */
export const allChallengesInCurrentCourse = createSelector(
  [getCurrentCourse],
  course => {
    const list = course?.modules
      .map(x => x.challenges)
      .reduce((agg, x) => agg.concat(x)); // Flatten
    return list;
  },
);

/**
 * Retrieve the next and previous challenge for a given challenge.
 */
export const nextPrevChallenges = createSelector(
  [allChallengesInCurrentCourse, getCurrentChallengeId],
  (challenges, challengeId) => {
    const i: number | undefined = challenges?.findIndex(
      x => x.id === challengeId,
    );

    if (i === undefined || i === -1) {
      return { prev: null, next: null };
    } else {
      return {
        prev: challenges?.[i - 1],
        next: challenges?.[i + 1],
      };
    }
  },
);
