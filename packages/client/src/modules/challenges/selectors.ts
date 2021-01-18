import identity from "ramda/es/identity";
import { createSelector } from "reselect";
import { CodeChallengeBlob } from "@pairwise/common";
import { ReduxStoreState } from "modules/root";
import prop from "ramda/es/prop";
import { SANDBOX_ID } from "tools/constants";
import { findCourseById } from "tools/utils";
import { userProgress } from "modules/user/selectors";
import { BreadcrumbsData } from "components/Breadcrumbs";

/** ===========================================================================
 * Selectors
 * ============================================================================
 */

export const challengesState = (state: ReduxStoreState) => {
  return state.challenges;
};

export const challengesSelector = createSelector([challengesState], identity);

export const isEditMode = createSelector([challengesState], prop("isEditMode"));
export const isDirty = createSelector([challengesState], prop("isDirty"));

export const editModeAlternativeViewEnabled = createSelector(
  [challengesState],
  x => x.editModeAlternativeView,
);

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

export const getIsSearching = createSelector(
  [challengesState],
  challenges => challenges.isSearching,
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

export const isLoadingCurrentChallengeBlob = createSelector(
  [getCurrentChallengeId, getBlobCache],
  (id, cache) => {
    if (id) {
      const cachedBlob = cache[id];
      if (cachedBlob) {
        return cachedBlob.isLoading;
      }
    }

    // Default case is true if we have no cache data
    return true;
  },
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
 * Determine if the user has completed the current challenge.
 */
export const isCurrentChallengeComplete = createSelector(
  [getCurrentActiveIds, userProgress],
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
 * Determine if the current challenge is in the Backend module
 * using that module's current id and the hard-coded module id.
 */
export const isBackendModuleChallenge = createSelector(
  [getChallengeMap, getCurrentChallengeId],
  (challengeMap, challengeId) => {
    if (challengeMap && challengeId) {
      const challenge = challengeMap[challengeId];
      if (challenge) {
        const BACKEND_MODULE_ID = "EmSvFhW8";
        return challenge.moduleId === BACKEND_MODULE_ID;
      }
    }

    return false;
  },
);

/**
 * Determine if the current challenge is in the Databases module
 * using that module's current id and the hard-coded module id for the
 * Database challenges.
 */
export const isDatabaseChallenge = createSelector(
  [getChallengeMap, getCurrentChallengeId],
  (challengeMap, challengeId) => {
    if (challengeMap && challengeId) {
      const challenge = challengeMap[challengeId];
      if (challenge) {
        const DATABASE_MODULE_ID = "f0pDYSOV";
        return challenge.moduleId === DATABASE_MODULE_ID;
      }
    }

    return false;
  },
);

/**
 * Derive if the current challenge is a SQL challenge within the Databases
 * module. Since sections are not actually part of the data structure, use
 * challenges of type "section" as bookends to find the challenges that belong
 * to the SQL Database section within the module.
 */
export const isSqlChallenge = createSelector(
  [getCurrentChallengeId, courseSkeletons, isDatabaseChallenge],
  (challengeId, courseSkeletons, isDatabaseChallenge) => {
    if (isDatabaseChallenge && challengeId) {
      const DATABASE_MODULE_ID = "f0pDYSOV";
      const SQL_SECTION_ID = "uDMmWREE8";
      const TYPESCRIPT_COURSE_ID = "fpvPtfu7s";

      const databaseChallenges = courseSkeletons
        ?.find(({ id }) => id === TYPESCRIPT_COURSE_ID)
        ?.modules.find(({ id }) => id === DATABASE_MODULE_ID)?.challenges;

      if (databaseChallenges) {
        const startIndex = databaseChallenges.findIndex(
          ({ id }) => id === SQL_SECTION_ID,
        );
        const fromStart = databaseChallenges.slice(startIndex);
        const endIndex = fromStart.findIndex(
          ({ type }, i) => i !== 0 && type === "section",
        );

        const sqlChallengeMap = fromStart
          .slice(0, endIndex)
          .reduce<{ [k: string]: true }>((acc, curr) => {
            acc[curr.id] = true;
            return acc;
          }, {});

        return !!sqlChallengeMap[challengeId];
      }
    }

    return false;
  },
);

/**
 * Get the breadcrumbs path for a given challenge. We need to take the
 * current challenge id and look it up in its course/module to assemble the
 * correct breadcrumbs path. This is because the currentModule state we track
 * actually can change when you click around the NavigationOverlay...
 * (kind of a bug... or not?).
 */
export const breadcrumbPathSelector = createSelector(
  [getCurrentChallengeId, getChallengeMap, courseList],
  (id, challengeMap, courses): Nullable<BreadcrumbsData> => {
    // No crumbs if not module or challenge...
    if (!id || !challengeMap) {
      return null;
    }

    // We need to find the current challenge and module in the  course list...
    const challengeMeta = challengeMap[id];
    const currentCourse = courses?.find(c => c.id === challengeMeta.courseId);
    const currentModule = currentCourse?.modules.find(
      m => m.id === challengeMeta.moduleId,
    );
    const challenge = currentModule?.challenges.find(
      c => c.id === challengeMeta.challenge.id,
    );

    if (!currentModule || !challenge) {
      return null;
    }

    let sectionTitle: Nullable<string> = null;
    let challengeTitle: Nullable<string> = challenge.title;

    // Find the parent section for the challenge
    for (const x of currentModule.challenges) {
      if (x.type === "section") {
        sectionTitle = x.title;

        // Erase the challenge title if the challenge is the section
        if (x.id === challenge.id) {
          challengeTitle = null;
        }
      }

      // Once you found the challenge exit
      if (x.id === challenge.id) {
        break;
      }
    }

    const { type } = challenge;

    const result: BreadcrumbsData = {
      module: { title: currentModule.title, type: "module" },
      section: sectionTitle ? { title: sectionTitle, type: "section" } : null,
      challenge: challengeTitle ? { title: challengeTitle, type } : null,
    };

    return result;
  },
);

/**
 * Get the code blob for a challenge. Defaults to null if various
 * expected pieces of state do not exist.
 */
export const getBlobForCurrentChallenge = createSelector(
  [
    isLoadingCurrentChallengeBlob,
    getBlobCache,
    getCurrentChallenge,
    isEditMode,
    adminEditorTabSelector,
  ],
  (isLoading, blobs, challenge, isEdit, adminTab) => {
    if (isLoading || !challenge) {
      return null;
    }

    if (isEdit) {
      const editorChallengeBlob: CodeChallengeBlob = {
        type: "challenge",
        code: challenge[adminTab],
      };
      return editorChallengeBlob;
    }

    return blobs[challenge.id]?.dataBlob || null;
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

export const getCurrentInstructions = createSelector(
  [getCurrentChallenge],
  challenge => challenge?.instructions,
);

export const getHasMediaContent = createSelector(
  [getCurrentChallenge],
  challenge => {
    return !!(challenge?.content || challenge?.videoUrl);
  },
);

export const revealSolutionCode = createSelector(
  [challengesState],
  x => x.revealWorkspaceSolution,
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
