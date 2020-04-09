import { createReducer } from "typesafe-actions";
import {
  Module,
  Challenge,
  CourseList,
  CourseSkeletonList,
  DataBlob,
  ModuleList,
} from "@pairwise/common";
import insert from "ramda/es/insert";
import move from "ramda/es/move";
import lensPath from "ramda/es/lensPath";
import over from "ramda/es/over";
import * as actions from "./actions";
import App, { AppActionTypes } from "../app/index";
import {
  ChallengeCreationPayload,
  InverseChallengeMapping,
  ModuleCreationPayload,
  ChallengeDeletePayload,
  ChallengeReorderPayload,
  ModuleReorderPayload,
  SearchResult,
} from "./types";
import { SANDBOX_ID } from "tools/constants";
import { defaultSandboxChallenge } from "tools/utils";
import { ChallengesActionTypes } from "./index";

const debug = require("debug")("client:challenge:store");

/** ===========================================================================
 * Challenges Store
 * ============================================================================
 */

export type ADMIN_TEST_TAB = "testResults" | "testCode";
export type ADMIN_EDITOR_TAB = "starterCode" | "solutionCode";

interface AccordionViewState {
  [key: string]: boolean;
}

export interface State {
  workspaceLoading: boolean;
  isEditMode: boolean;
  displayNavigationMap: boolean;
  courses: Nullable<CourseList>;
  courseSkeletons: Nullable<CourseSkeletonList>;
  currentModuleId: Nullable<string>;
  currentCourseId: Nullable<string>;
  currentChallengeId: Nullable<string>;
  challengeMap: Nullable<InverseChallengeMapping>;
  sandboxChallenge: Challenge;
  blobCache: { [key: string]: DataBlob };
  loadingCurrentBlob: boolean;
  adminTestTab: ADMIN_TEST_TAB;
  adminEditorTab: ADMIN_EDITOR_TAB;
  navigationSectionAccordionViewState: AccordionViewState;
  searchResults: SearchResult[];
  isSearching: boolean;
  revealWorkspaceSolution: boolean;
}

const initialState: State = {
  courses: null,
  courseSkeletons: null,
  isEditMode: false,
  workspaceLoading: true,
  currentModuleId: null,
  currentCourseId: null,
  currentChallengeId: null,
  displayNavigationMap: false,
  challengeMap: null,
  sandboxChallenge: defaultSandboxChallenge,
  blobCache: {},
  loadingCurrentBlob: true,
  adminTestTab: "testResults",
  adminEditorTab: "starterCode",
  navigationSectionAccordionViewState: {},
  searchResults: [],
  isSearching: false,
  revealWorkspaceSolution: false,
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

const updateChallenge = (courses: CourseList, update: ChallengeUpdate) => {
  const courseIndex = courses.findIndex(c => c.id === update.courseId);
  const moduleIndex = courses[courseIndex].modules.findIndex(
    m => m.id === update.moduleId,
  );
  const challengeIndex = courses[courseIndex].modules[
    moduleIndex
  ].challenges.findIndex(ch => ch.id === update.id);
  const keyPath: any[] = [
    courseIndex,
    "modules",
    moduleIndex,
    "challenges",
    challengeIndex,
  ];
  const lens = lensPath(keyPath);

  debug("[INFO] keyPath", keyPath);

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

  const updatedCourses = courseList.map(c => {
    if (c.id === courseId) {
      return {
        ...c,
        modules: c.modules.map(m => {
          if (m.id === moduleId) {
            return {
              ...m,
              challenges: m.challenges.filter(ch => ch.id !== challengeId),
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
  const courseIndex = courses.findIndex(c => c.id === update.courseId);
  const moduleIndex = courses[courseIndex].modules.findIndex(
    m => m.id === update.id,
  );
  const lens = lensPath([courseIndex, "modules", moduleIndex]);
  return over(lens, (x: Module) => ({ ...x, ...update.module }), courses);
};

const insertModule = (
  courses: CourseList,
  payload: ModuleCreationPayload,
): CourseList => {
  const courseIndex = courses.findIndex(x => x.id === payload.courseId);
  const lens = lensPath([courseIndex, "modules"]);
  return over(lens, insert(payload.insertionIndex, payload.module), courses);
};

const insertChallenge = (
  courses: CourseList,
  insertion: ChallengeCreationPayload,
): CourseList => {
  const { moduleId, courseId, insertionIndex, challenge } = insertion;
  const courseIndex = courses.findIndex(x => x.id === courseId);
  const moduleIndex = courses[courseIndex].modules.findIndex(
    m => m.id === moduleId,
  );
  const lens = lensPath([courseIndex, "modules", moduleIndex, "challenges"]);
  return over(lens, insert(insertionIndex, challenge), courses);
};

const reorderChallengeList = (
  courses: CourseList,
  challengeReorderPayload: ChallengeReorderPayload,
) => {
  const {
    courseId,
    moduleId,
    challengeOldIndex,
    challengeNewIndex,
  } = challengeReorderPayload;

  const courseIndex = courses.findIndex(x => x.id === courseId);
  const moduleIndex = courses[courseIndex].modules.findIndex(
    m => m.id === moduleId,
  );
  const lens = lensPath([courseIndex, "modules", moduleIndex, "challenges"]);
  return over(lens, move(challengeOldIndex, challengeNewIndex), courses);
};

const reorderModuleList = (
  courses: CourseList,
  moduleReorderPayload: ModuleReorderPayload,
) => {
  const { courseId, moduleOldIndex, moduleNewIndex } = moduleReorderPayload;

  const courseIndex = courses.findIndex(x => x.id === courseId);
  const lens = lensPath([courseIndex, "modules"]);
  return over(lens, move(moduleOldIndex, moduleNewIndex), courses);
};

/** ===========================================================================
 * Store
 * ============================================================================
 */

const challenges = createReducer<State, ChallengesActionTypes | AppActionTypes>(
  initialState,
)
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
  .handleAction(actions.deleteCourseModule, (state, { payload }) => {
    const { courses, courseSkeletons } = state;

    if (!courses || !courseSkeletons) {
      return state;
    }

    const { id, courseId } = payload;

    let updatedModules: ModuleList = [];

    const updatedCourses = courses.map(c => {
      if (c.id === courseId) {
        updatedModules = c.modules.filter(m => m.id !== id);
        return {
          ...c,
          modules: updatedModules,
        };
      } else {
        return c;
      }
    });

    return {
      ...state,
      courses: updatedCourses,
      courseSkeletons: courseSkeletons.map(c => {
        if (c.id === courseId) {
          return {
            ...c,
            modules: c.modules.filter(m => m.id !== id),
          };
        } else {
          return c;
        }
      }),
    };
  })
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

    return {
      ...state,
      courses: updateChallenge(courses, { id, moduleId, courseId, challenge }),
      // @ts-ignore
      courseSkeletons: updateChallenge(courseSkeletons, {
        id,
        moduleId,
        courseId,
        challenge,
      }),
    };
  })
  .handleAction(actions.deleteChallenge, (state, action) => {
    const { courses, courseSkeletons } = state;

    if (!courses || !courseSkeletons) {
      return state;
    }

    const updatedCourses = deleteChallengeFromCourse<CourseList>(
      courses,
      action.payload,
    );
    const updatedCourseSkeletons = deleteChallengeFromCourse<
      CourseSkeletonList
    >(courseSkeletons, action.payload);

    return {
      ...state,
      courses: updatedCourses,
      courseSkeletons: updatedCourseSkeletons,
    };
  })
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
  }))
  .handleAction(actions.setActiveChallengeIds, (state, { payload }) => ({
    ...state,
    currentModuleId: payload.currentModuleId,
    currentCourseId: payload.currentCourseId,
    currentChallengeId: payload.currentChallengeId,
  }))
  .handleAction(actions.updateCurrentChallengeBlob, (state, action) => ({
    ...state,
    blobCache: {
      ...state.blobCache,
      [action.payload.challengeId]: action.payload.dataBlob,
    },
  }))
  .handleAction(actions.fetchBlobForChallenge, (state, action) => ({
    ...state,
    loadingCurrentBlob: true,
  }))
  .handleAction(actions.fetchBlobForChallengeSuccess, (state, action) => ({
    ...state,
    loadingCurrentBlob: false,
    blobCache: {
      ...state.blobCache,
      [action.payload.challengeId]: action.payload.dataBlob,
    },
  }))
  .handleAction(actions.fetchBlobForChallengeFailure, (state, action) => ({
    ...state,
    loadingCurrentBlob: false,
  }))
  .handleAction(actions.setWorkspaceChallengeLoaded, (state, action) => ({
    ...state,
    workspaceLoading: false,
  }))
  .handleAction(App.actions.locationChange, (state, action) => ({
    ...state,
    displayNavigationMap: false,
  }))
  .handleAction(actions.setNavigationMapState, (state, action) => ({
    ...state,
    displayNavigationMap: action.payload,
  }))
  .handleAction(actions.storeInverseChallengeMapping, (state, action) => ({
    ...state,
    challengeMap: action.payload,
  }))
  .handleAction(actions.setCurrentModule, (state, action) => ({
    ...state,
    currentModuleId: action.payload,
  }))
  .handleAction(actions.setCurrentCourse, (state, action) => ({
    ...state,
    currentCourseId: action.payload,
    // Update the current module id to the first module in the course
    currentModuleId: state.courses?.find(c => c.id === action.payload)
      ?.modules[0].id as string,
  }))
  .handleAction(actions.setChallengeId, (state, action) => ({
    ...state,
    adminTestTab: "testResults",
    adminEditorTab: "starterCode",
    loadingCurrentBlob: true,
    displayNavigationMap: false,
    revealWorkspaceSolution: false,
    currentChallengeId: action.payload.currentChallengeId,
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
  .handleAction(
    actions.fetchCurrentActiveCourseSuccess,
    (state, { payload }) => ({
      ...state,
      ...payload,
    }),
  );

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default challenges;
