import identity from "ramda/es/identity";
import { createSelector } from "reselect";
import { CodeChallengeBlob } from "@pairwise/common";
import { ReduxStoreState } from "modules/root";
import prop from "ramda/es/prop";
import { SANDBOX_ID } from "tools/constants";
import { findCourseById } from "tools/utils";

/** ===========================================================================
 * Selectors
 * ============================================================================
 */

export const challengesState = (state: ReduxStoreState) => {
  return state.challenges;
};

export const challengesSelector = createSelector([challengesState], identity);

export const isEditMode = createSelector([challengesState], prop("isEditMode"));

export const adminTestTabSelector = createSelector(
  [challengesState],
  x => x.adminTestTab,
);

export const adminEditorTabSelector = createSelector(
  [challengesState],
  x => x.adminEditorTab,
);

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

export const navigationOverlayVisible = createSelector(
  [challengesState],
  challenges => challenges.displayNavigationMap,
);

export const getSearchResults = createSelector(
  [challengesState],
  challenges => challenges.searchResults,
);

export const getNavigationSectionAccordionViewState = createSelector(
  [challengesState],
  prop("navigationSectionAccordionViewState"),
);

export const courseList = createSelector(
  [challengesState],
  challenges => challenges.courses,
);

export const courseSkeletons = createSelector(
  [challengesState],
  challenges => challenges.courseSkeletons,
);

export const getBlobCache = createSelector(
  [challengesState],
  state => state.blobCache,
);

export const isLoadingBlob = createSelector(
  [challengesState],
  state => state.loadingCurrentBlob,
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
  [challengesState],
  state => {
    return state.courseSkeletons?.find(x => x.id === state.currentCourseId);
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

/**
 * NOTE: This getter does not depend on the current course id or module id. This
 * is important. This will find the full challenge data for the challenge with
 * state.currentChallengeId. In other words, currentCourseId and
 * currentModuleId do not necessarily need to be the course and module for the
 * challenge with currentChallengeId.
 *
 * This allows the nav to be used on top of the current challenge workspace
 * without changing it every time the user clicks a new module.
 */
export const getCurrentChallenge = createSelector(
  [getChallengeMap, getCurrentChallengeId, challengesState],
  (challengeMap, challengeId, state) => {
    // Just a type assertion to de-nullify
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

/**
 * Get the code blob for a challenge.
 */
export const getBlobForCurrentChallenge = createSelector(
  [isLoadingBlob, getBlobCache, getCurrentChallenge, isEditMode],
  (isLoading, blobs, challenge, isEdit) => {
    if (isLoading) {
      return null;
    } else {
      if (!challenge) {
        return null;
      } else {
        if (isEdit) {
          /**
           * TODO: Should be adminEditorTab state after moving it from the
           * Workspace to Redux Store:
           */
          const tab = "starterCode";
          const editorChallengeBlob: CodeChallengeBlob = {
            type: "challenge",
            code: challenge[tab],
          };
          return editorChallengeBlob;
        } else {
          return blobs[challenge.id];
        }
      }
    }
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

export const getHasMediaContent = createSelector(
  [getCurrentChallenge],
  challenge => {
    return !!(challenge?.supplementaryContent || challenge?.videoUrl);
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
