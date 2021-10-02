import { createReducer } from "typesafe-actions";
import {
  Module,
  Challenge,
  CourseList,
  CourseSkeletonList,
  InverseChallengeMapping,
  DataBlob,
  ModuleList,
  CHALLENGE_TYPE,
} from "@pairwise/common";
import insert from "ramda/es/insert";
import move from "ramda/es/move";
import lensPath from "ramda/es/lensPath";
import over from "ramda/es/over";
import * as actions from "./actions";
import App, { AppActionTypes } from "../app/index";
import {
  ChallengeCreationPayload,
  ModuleCreationPayload,
  ChallengeDeletePayload,
  ChallengeReorderPayload,
  ModuleReorderPayload,
  SearchResult,
} from "./types";
import { SANDBOX_ID } from "tools/constants";
import { defaultSandboxChallenge } from "tools/utils";
import { ChallengesActionTypes } from "./index";
import { view } from "ramda";

/** ===========================================================================
 * Challenges Store
 * ============================================================================
 */

// instructions are available in alternate edit mode
export type ADMIN_EDITOR_TAB = "instructions" | "starterCode" | "solutionCode";

// console view is available in alternate edit mode
export type ADMIN_TEST_TAB = "testResults" | "testCode" | "console";

interface AccordionViewState {
  [key: string]: boolean;
}

/**
 * The challenge blobs represent the user's past history on a challenge,
 * and they get fetched one by one by id. The blobCache stores the blob
 * data and loading status for each blob. The workspace waits for blobs
 * to load before rendering.
 */
interface BlobCacheItem {
  dataBlob?: DataBlob;
  isLoading: boolean;
}

export type MENU_SELECT_COLUMN = "modules" | "challenges";

export interface State {
  workspaceLoading: boolean;
  isEditMode: boolean;
  editModeAlternativeView: boolean;
  displayNavigationMap: boolean;
  courses: Nullable<CourseList>;
  courseSkeletons: Nullable<CourseSkeletonList>;
  // Active id set related to currently selected challenge.
  currentModuleId: Nullable<string>;
  currentCourseId: Nullable<string>;
  currentChallengeId: Nullable<string>;
  // Store navigation overlay view state separately from current active
  // course, module, and challenge ids. A bit convoluted but avoids other
  // bugs which would otherwise occur when navigating the NavigationOverlay,
  // e.g. a user selects another course to view it and then the currentCourseId
  // doesn't match the actual challenge they are on.
  currentNavigationOverlayModuleId: Nullable<string>;
  currentNavigationOverlayCourseId: Nullable<string>;
  challengeMap: Nullable<InverseChallengeMapping>;
  sandboxChallenge: Challenge;
  blobCache: { [key: string]: BlobCacheItem };
  adminTestTab: ADMIN_TEST_TAB;
  adminEditorTab: ADMIN_EDITOR_TAB;
  navigationSectionAccordionViewState: AccordionViewState;
  searchResults: SearchResult[];
  isSearching: boolean;
  revealWorkspaceSolution: boolean;
  isDirty: boolean;
  menuSelectColumn: MENU_SELECT_COLUMN;
  menuSelectIndexModules: number | null;
  menuSelectIndexChallenges: number | null;
  useCodemirror: boolean;
  isInstructionsViewCollapsed: boolean;
  deepLinkCodeString: Nullable<string>;
  deepLinkSandboxChallengeType: Nullable<CHALLENGE_TYPE>;
  pullRequestChallengeIds: Set<string>;
  fetchingPullRequestCourses: boolean;
  showChallengeInstructionsModal: boolean;
}

const initialState: State = {
  courses: null,
  courseSkeletons: null,
  isEditMode: false,
  editModeAlternativeView: false,
  workspaceLoading: true,
  currentModuleId: null,
  currentCourseId: null,
  currentChallengeId: null,
  currentNavigationOverlayModuleId: null,
  currentNavigationOverlayCourseId: null,
  displayNavigationMap: false,
  challengeMap: null,
  sandboxChallenge: defaultSandboxChallenge,
  blobCache: {},
  adminTestTab: "testResults",
  adminEditorTab: "starterCode",
  navigationSectionAccordionViewState: {},
  searchResults: [],
  isSearching: false,
  revealWorkspaceSolution: false,
  isDirty: false,
  menuSelectColumn: "challenges",
  menuSelectIndexModules: null,
  menuSelectIndexChallenges: null,
  useCodemirror: false,
  isInstructionsViewCollapsed: false,
  deepLinkCodeString: null,
  deepLinkSandboxChallengeType: null,
  pullRequestChallengeIds: new Set(),
  fetchingPullRequestCourses: false,
  showChallengeInstructionsModal: false,
};

/** ===========================================================================
 * Store Utils
 * ============================================================================
 */

interface ChallengeUpdate {
  id: string; // Challenge ID
  moduleId: string;
  courseId: string;
  challenge: Partial<Challenge>;
}

const getChallengeLens = (courses: CourseList, payload: ChallengeUpdate) => {
  const courseIndex = courses.findIndex((c) => c.id === payload.courseId);
  const moduleIndex = courses[courseIndex].modules.findIndex(
    (m) => m.id === payload.moduleId,
  );
  const challengeIndex = courses[courseIndex].modules[
    moduleIndex
  ].challenges.findIndex((ch) => ch.id === payload.id);
  const keyPath: any[] = [
    courseIndex,
    "modules",
    moduleIndex,
    "challenges",
    challengeIndex,
  ];

  return lensPath(keyPath);
};

const getChallenge = (
  courses: CourseList,
  update: ChallengeUpdate,
): Nullable<Challenge> => {
  const lens = getChallengeLens(courses, update);
  return view(lens, courses);
};

const updateChallenge = (courses: CourseList, update: ChallengeUpdate) => {
  const lens = getChallengeLens(courses, update);
  return over(lens, (x: Challenge) => ({ ...x, ...update.challenge }), courses);
};

/**
 * Take a course or course skeleton list and remove a challenge from it
 * as specified by the ids in ChallengeDeletePayload.
 *
 * NOTE: The types are shit! I tried to make the function generic to accept
 * a course list or course skeleton list but had trouble coercing TypeScript
 * to accept it.
 */
const deleteChallengeFromCourse = <T extends CourseList | CourseSkeletonList>(
  courses: CourseList | CourseSkeletonList,
  deletionIds: ChallengeDeletePayload,
): T => {
  const { courseId, moduleId, challengeId } = deletionIds;

  const courseList: CourseList = courses as CourseList; /* ugh */

  const updatedCourses = courseList.map((c) => {
    if (c.id === courseId) {
      return {
        ...c,
        modules: c.modules.map((m) => {
          if (m.id === moduleId) {
            return {
              ...m,
              challenges: m.challenges.filter((ch) => ch.id !== challengeId),
            };
          } else {
            return m;
          }
        }),
      };
    } else {
      return c;
    }
  });

  return updatedCourses as T; /* ugh */
};

interface ModuleUpdate {
  id: string;
  courseId: string;
  module: Partial<Module>;
}

const updateModule = (courses: CourseList, update: ModuleUpdate) => {
  const courseIndex = courses.findIndex((c) => c.id === update.courseId);
  const moduleIndex = courses[courseIndex].modules.findIndex(
    (m) => m.id === update.id,
  );
  const lens = lensPath([courseIndex, "modules", moduleIndex]);
  return over(lens, (x: Module) => ({ ...x, ...update.module }), courses);
};

const insertModule = (
  courses: CourseList,
  payload: ModuleCreationPayload,
): CourseList => {
  const courseIndex = courses.findIndex((x) => x.id === payload.courseId);
  const lens = lensPath([courseIndex, "modules"]);
  return over(lens, insert(payload.insertionIndex, payload.module), courses);
};

const insertChallenge = (
  courses: CourseList,
  insertion: ChallengeCreationPayload,
): CourseList => {
  const { moduleId, courseId, insertionIndex, challenge } = insertion;
  const courseIndex = courses.findIndex((x) => x.id === courseId);
  const moduleIndex = courses[courseIndex].modules.findIndex(
    (m) => m.id === moduleId,
  );
  const lens = lensPath([courseIndex, "modules", moduleIndex, "challenges"]);
  return over(lens, insert(insertionIndex, challenge), courses);
};

const reorderChallengeList = (
  courses: CourseList,
  challengeReorderPayload: ChallengeReorderPayload,
) => {
  const { courseId, moduleId, challengeOldIndex, challengeNewIndex } =
    challengeReorderPayload;

  const courseIndex = courses.findIndex((x) => x.id === courseId);
  const moduleIndex = courses[courseIndex].modules.findIndex(
    (m) => m.id === moduleId,
  );
  const lens = lensPath([courseIndex, "modules", moduleIndex, "challenges"]);
  return over(lens, move(challengeOldIndex, challengeNewIndex), courses);
};

const reorderModuleList = (
  courses: CourseList,
  moduleReorderPayload: ModuleReorderPayload,
) => {
  const { courseId, moduleOldIndex, moduleNewIndex } = moduleReorderPayload;

  const courseIndex = courses.findIndex((x) => x.id === courseId);
  const lens = lensPath([courseIndex, "modules"]);
  return over(lens, move(moduleOldIndex, moduleNewIndex), courses);
};

/**
 * Find the challenge before the module or challenge which was deleted, to
 * reset the challenge ids context after a content item is deleted using
 * Codepress.
 *
 * This function just walks through the course/modules/challenges list until
 * it finds the item matching the deleted id and then it returns the
 * appropriate context ids for the previous item in the list.
 *
 * If the deleted item is first in the list, this will result in null being
 * returned, which will lead the app to redirect to /home (see the
 * challenge epic: resetChallengeContextAfterDeletionEpic).
 */
const getNewChallengeContextAfterContentDeletion = (
  challengeOrModuleId: string,
  courseList: CourseList,
) => {
  let currentModuleId = null;
  let currentCourseId = null;
  let currentChallengeId = null;

  for (const course of courseList) {
    currentCourseId = course.id;

    for (const mod of course.modules) {
      if (mod.id === challengeOrModuleId) {
        return {
          currentModuleId,
          currentCourseId,
          currentChallengeId,
        };
      }

      currentModuleId = mod.id;

      for (const challenge of mod.challenges) {
        if (challenge.id === challengeOrModuleId) {
          return {
            currentModuleId,
            currentCourseId,
            currentChallengeId,
          };
        }

        currentChallengeId = challenge.id;
      }
    }
  }
};

/** ===========================================================================
 * Store
 * ============================================================================
 */

const challenges = createReducer<State, ChallengesActionTypes | AppActionTypes>(
  initialState,
)
  // @ts-ignore
  .handleAction(actions.createChallenge, (state, action) => {
    const { courses, courseSkeletons } = state;

    if (!courses || !courseSkeletons) {
      return state;
    }

    return {
      ...state,
      courses: insertChallenge(courses, action.payload),
      // @ts-ignore
      courseSkeletons: insertChallenge(courseSkeletons, {
        ...action.payload,
        challenge: {
          ...action.payload.challenge,
          userCanAccess: true,
        },
      }),
    };
  })
  // @ts-ignore
  .handleAction(actions.createCourseModule, (state, action) => {
    const { courses, courseSkeletons } = state;

    if (!courses || !courseSkeletons) {
      return state;
    }

    return {
      ...state,
      courses: insertModule(courses, action.payload),

      // @ts-ignore
      courseSkeletons: insertModule(courseSkeletons, {
        ...action.payload,
        module: {
          ...action.payload.module,
          userCanAccess: true,
        },
      }),
    };
  })
  // @ts-ignore
  .handleAction(actions.updateChallenge, (state, action) => {
    const { courses, courseSkeletons } = state;
    const { id, challenge } = action.payload;
    const mapping = state.challengeMap?.[id];

    // If the user is typing away in the sandbox we handle it differently
    if (id === SANDBOX_ID) {
      return {
        ...state,
        sandboxChallenge: {
          ...state.sandboxChallenge,
          ...challenge,
        },
      };
    }

    if (!mapping || !courses) {
      return state;
    }

    const { moduleId, courseId } = mapping;
    const update = { id, moduleId, courseId, challenge };
    const existingChallenge = getChallenge(courses, update);

    // Check if the state of our workspace is dirty. Update challenge calls are
    // fired all the time, including when you just click into a challenge in
    // edit mode. Therefor we want to do a diff to determine dirtiness but also
    // default to the current state if its true. Otherwise those updates getting
    // fired without any additional data will make state clean again even when
    // there are unsaved changes. As is we only enter a dirty state when
    // something changes and only leave the dirty state on successful save
    const isDirty =
      state.isDirty ||
      (existingChallenge &&
        // @ts-ignore TS really needs to fix Object.keys typings. Returns string, but we want keyof X
        Object.keys(challenge).some((k: keyof Challenge) => {
          return challenge[k] !== existingChallenge[k];
        }));

    return {
      ...state,
      isDirty,
      courses: updateChallenge(courses, update),
      // @ts-ignore
      courseSkeletons: updateChallenge(courseSkeletons, update),
    };
  })
  .handleAction(actions.saveCourseSuccess, (state) => ({
    ...state,
    isDirty: false,
  }))
  .handleAction(actions.deleteChallenge, (state, action) => {
    const { courses, courseSkeletons } = state;

    if (!courses || !courseSkeletons) {
      return state;
    }

    const updatedCourses = deleteChallengeFromCourse<CourseList>(
      courses,
      action.payload,
    );
    const updatedCourseSkeletons =
      deleteChallengeFromCourse<CourseSkeletonList>(
        courseSkeletons,
        action.payload,
      );

    const ids = getNewChallengeContextAfterContentDeletion(
      action.payload.challengeId,
      courses,
    );

    return {
      ...state,
      ...ids,
      courses: updatedCourses,
      courseSkeletons: updatedCourseSkeletons,
    };
  })
  .handleAction(actions.deleteCourseModule, (state, { payload }) => {
    const { courses, courseSkeletons } = state;

    if (!courses || !courseSkeletons) {
      return state;
    }

    const { id, courseId } = payload;

    let updatedModules: ModuleList = [];

    const updatedCourses = courses.map((c) => {
      if (c.id === courseId) {
        updatedModules = c.modules.filter((m) => m.id !== id);
        return {
          ...c,
          modules: updatedModules,
        };
      } else {
        return c;
      }
    });

    const updatedCourseSkeletons = courseSkeletons.map((c) => {
      if (c.id === courseId) {
        return {
          ...c,
          modules: c.modules.filter((m) => m.id !== id),
        };
      } else {
        return c;
      }
    });

    const ids = getNewChallengeContextAfterContentDeletion(id, courses);

    return {
      ...state,
      ...ids,
      courses: updatedCourses,
      courseSkeletons: updatedCourseSkeletons,
    };
  })
  // @ts-ignore
  .handleAction(actions.reorderChallengeList, (state, action) => {
    const { courses, courseSkeletons } = state;

    if (!courses || !courseSkeletons) {
      return state;
    }

    return {
      ...state,
      courses: reorderChallengeList(courses, action.payload),
      // @ts-ignore
      courseSkeletons: reorderChallengeList(courseSkeletons, action.payload),
    };
  })
  // @ts-ignore
  .handleAction(actions.reorderModuleList, (state, action) => {
    const { courses, courseSkeletons } = state;

    if (!courses || !courseSkeletons) {
      return state;
    }

    return {
      ...state,
      courses: reorderModuleList(courses, action.payload),
      // @ts-ignore
      courseSkeletons: reorderModuleList(courseSkeletons, action.payload),
    };
  })
  // @ts-ignore
  .handleAction(actions.updateCourseModule, (state, action) => {
    const { courses, courseSkeletons } = state;

    if (!courses || !courseSkeletons) {
      return state;
    }

    return {
      ...state,
      courses: updateModule(courses, action.payload),
      // @ts-ignore
      courseSkeletons: updateModule(courseSkeletons, action.payload),
    };
  })
  .handleAction(actions.setEditMode, (state, action) => ({
    ...state,
    isEditMode: action.payload,
    editModeAlternativeView: false,
    // Reset to default whenever isEditMode changes
    adminTestTab: "testResults",
    adminEditorTab: "starterCode",
  }))
  .handleAction(actions.setChallengeIdContext, (state, { payload }) => ({
    ...state,
    adminTestTab: "testResults",
    adminEditorTab: "starterCode",
    displayNavigationMap: false,
    revealWorkspaceSolution: false,
    // Set active ids
    currentModuleId: payload.currentModuleId,
    currentCourseId: payload.currentCourseId,
    currentChallengeId: payload.currentChallengeId,
    // Set the navigation overlay to the selected course and module
    currentNavigationOverlayCourseId: payload.currentCourseId,
    currentNavigationOverlayModuleId: payload.currentModuleId,
  }))
  .handleAction(actions.updateCurrentChallengeBlob, (state, action) => ({
    ...state,
    blobCache: {
      ...state.blobCache,
      [action.payload.challengeId]: {
        isLoading: false,
        dataBlob: action.payload.dataBlob,
      },
    },
  }))
  .handleAction(actions.fetchBlobForChallenge, (state, action) => ({
    ...state,
    blobCache: {
      ...state.blobCache,
      [action.payload]: {
        isLoading: true,
        dataBlob: state.blobCache[action.payload]?.dataBlob,
      },
    },
  }))
  .handleAction(actions.fetchBlobForChallengeSuccess, (state, action) => ({
    ...state,
    blobCache: {
      ...state.blobCache,
      [action.payload.challengeId]: {
        isLoading: false,
        dataBlob: action.payload.dataBlob,
      },
    },
  }))
  .handleAction(actions.fetchBlobForChallengeFailure, (state, action) => ({
    ...state,
    blobCache: {
      ...state.blobCache,
      [action.payload.challengeId]: {
        isLoading: false,
        dataBlob: state.blobCache[action.payload.challengeId]?.dataBlob,
      },
    },
  }))
  .handleAction(actions.setWorkspaceChallengeLoaded, (state, action) => ({
    ...state,
    workspaceLoading: false,
  }))
  .handleAction(App.actions.locationChange, (state, action) => ({
    ...state,
    displayNavigationMap: false,
    // Hide the overall, if it was visible, on navigation
    showChallengeInstructionsModal: false,
  }))
  .handleAction(actions.setNavigationMapState, (state, action) => ({
    ...state,
    displayNavigationMap: action.payload,
  }))
  .handleAction(actions.storeInverseChallengeMapping, (state, action) => ({
    ...state,
    challengeMap: action.payload,
  }))
  .handleAction(actions.setNavigationOverlayCurrentModule, (state, action) => ({
    ...state,
    currentNavigationOverlayModuleId: action.payload,
  }))
  .handleAction(actions.setNavigationOverlayCurrentCourse, (state, action) => ({
    ...state,
    menuSelectColumn: "challenges",
    menuSelectIndexModules: null,
    menuSelectIndexChallenges: null,
    currentNavigationOverlayCourseId: action.payload,
    // Update the current module id to the first module in the course
    currentNavigationOverlayModuleId: state.courses?.find(
      (c) => c.id === action.payload,
    )?.modules[0].id as string,
  }))
  .handleAction(actions.setCurrentModule, (state, action) => ({
    ...state,
    currentModuleId: action.payload,
  }))
  .handleAction(actions.setCurrentCourse, (state, action) => ({
    ...state,
    currentCourseId: action.payload,
    menuSelectColumn: "challenges",
    menuSelectIndexModules: null,
    menuSelectIndexChallenges: null,
    // Update the current module id to the first module in the course
    currentModuleId: state.courses?.find((c) => c.id === action.payload)
      ?.modules[0].id as string,
  }))
  .handleAction(actions.requestSearchResults, (state, action) => ({
    ...state,
    isSearching: true,
  }))
  .handleAction(actions.receiveSearchResults, (state, action) => ({
    ...state,
    searchResults: action.payload,
    isSearching: false,
  }))
  .handleAction(actions.fetchNavigationSkeletonSuccess, (state, action) => ({
    ...state,
    courseSkeletons: action.payload,
  }))
  .handleAction(actions.fetchPullRequestCourseList, (state, action) => ({
    ...state,
    fetchingPullRequestCourses: true,
  }))
  .handleAction(actions.fetchPullRequestCourseListFailure, (state, action) => ({
    ...state,
    fetchingPullRequestCourses: false,
  }))
  .handleAction(actions.fetchPullRequestCourseListSuccess, (state, action) => ({
    ...state,
    fetchingPullRequestCourses: false,
    courses: action.payload.courseList,
    courseSkeletons: action.payload.courseSkeletonList,
    pullRequestChallengeIds: new Set(action.payload.challengeIds),
  }))
  .handleAction(actions.resetPullRequestState, (state, action) => ({
    ...state,
    pullRequestChallengeIds: new Set(),
  }))
  .handleAction(actions.toggleSectionAccordionView, (state, action) => ({
    ...state,
    navigationSectionAccordionViewState: {
      ...state.navigationSectionAccordionViewState,
      [action.payload.sectionId]: action.payload.open,
    },
  }))
  .handleAction(actions.toggleRevealSolutionCode, (state, action) => ({
    ...state,
    revealWorkspaceSolution: action.payload.shouldReveal,
  }))
  .handleAction(actions.setAdminTestTab, (state, action) => ({
    ...state,
    adminTestTab: action.payload,
  }))
  .handleAction(actions.setAdminEditorTab, (state, action) => ({
    ...state,
    adminEditorTab: action.payload,
  }))
  .handleAction(actions.setMenuSelectColumn, (state, action) => ({
    ...state,
    menuSelectColumn: action.payload,
  }))
  .handleAction(actions.setMenuSelectIndex, (state, { payload }) => ({
    ...state,
    menuSelectIndexModules:
      payload.modules === undefined
        ? state.menuSelectIndexModules
        : payload.modules,
    menuSelectIndexChallenges:
      payload.challenges === undefined
        ? state.menuSelectIndexChallenges
        : payload.challenges,
  }))
  .handleAction(actions.toggleEditModeAlternativeView, (state, action) => ({
    ...state,
    adminTestTab: "testResults",
    adminEditorTab: "starterCode",
    editModeAlternativeView: !state.editModeAlternativeView,
  }))
  .handleAction(actions.toggleCodemirrorEditor, (state, action) => ({
    ...state,
    useCodemirror: !state.useCodemirror,
  }))
  .handleAction(actions.toggleInstructionsView, (state, action) => ({
    ...state,
    isInstructionsViewCollapsed: !state.isInstructionsViewCollapsed,
  }))
  .handleAction(actions.setDeepLinkCodeString, (state, action) => ({
    ...state,
    deepLinkCodeString: action.payload.codeString,
    deepLinkSandboxChallengeType: action.payload.sandboxChallengeType,
  }))
  .handleAction(
    actions.setChallengeInstructionsModalState,
    (state, action) => ({
      ...state,
      showChallengeInstructionsModal: action.payload,
    }),
  )
  .handleAction(actions.fetchCoursesSuccess, (state, { payload }) => ({
    ...state,
    ...payload,
  }));

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default challenges;
