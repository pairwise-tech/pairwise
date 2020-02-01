import { createReducer } from "typesafe-actions";
import {
  Challenge,
  CourseList,
  CourseSkeletonList,
  DataBlob,
  ModuleList,
} from "@pairwise/common";
import Module from "module";
import insert from "ramda/es/insert";
import lensPath from "ramda/es/lensPath";
import over from "ramda/es/over";
import * as actions from "./actions";
import App, { AppActionTypes } from "../app/index";
import {
  ChallengeCreationPayload,
  InverseChallengeMapping,
  ModuleCreationPayload,
} from "./types";
import { SANDBOX_ID } from "tools/constants";
import { defaultSandboxChallenge } from "tools/utils";
import { ChallengesActionTypes } from "./index";

const debug = require("debug")("challenge:store");

/** ===========================================================================
 * App Store
 * ============================================================================
 */

export type ADMIN_TEST_TAB = "testResults" | "testCode";
export type ADMIN_EDITOR_TAB = "starterCode" | "solutionCode";

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
  loadingCurrentBlob: false,
  adminTestTab: "testResults",
  adminEditorTab: "starterCode",
};

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
 * Take the current state and an update from deleting a challenge, and
 * determine new active course, module, and challenge ids in the event
 * that the user deleted the current active challenge.
 */
const getNewActiveIdsAfterChallengeDeletion = (
  state: State,
  updatedCourses: CourseList,
  idToDelete: string,
) => {
  const { currentModuleId, currentCourseId, currentChallengeId } = state;

  let newCurrentModuleId = currentModuleId;
  let newCurrentCourseId = currentCourseId;
  let newCurrentChallengeId = currentChallengeId;

  if (idToDelete !== currentChallengeId) {
    return {
      newCurrentModuleId,
      newCurrentCourseId,
      newCurrentChallengeId,
    };
  }

  for (const course of updatedCourses) {
    for (const module of course.modules) {
      if (module.challenges.length > 0) {
        newCurrentModuleId = module.id;
        newCurrentCourseId = course.id;
        newCurrentChallengeId = module.challenges[0].id;

        return {
          newCurrentModuleId,
          newCurrentCourseId,
          newCurrentChallengeId,
        };
      }
    }
  }

  return {
    newCurrentModuleId,
    newCurrentCourseId,
    newCurrentChallengeId,
  };
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
    const {
      courses,
      courseSkeletons,
      currentChallengeId,
      currentModuleId,
    } = state;

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

    /**
     * Reset the current challenge and module ids if the user just deleted
     * the current module.
     */
    let newCurrentModuleId = currentModuleId;
    let newCurrentChallengeId = currentChallengeId;
    if (id === currentModuleId && updatedModules.length) {
      newCurrentModuleId = updatedModules[0].id;
      newCurrentChallengeId = updatedModules[0].challenges[0].id;
    }

    return {
      ...state,
      currentModuleId: newCurrentModuleId,
      currentChallengeId: newCurrentChallengeId,
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
    const { courseId, moduleId, challengeId } = action.payload;

    if (!courses || !courseSkeletons) {
      return state;
    }

    const updatedCourses = courses.map(c => {
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

    const {
      newCurrentCourseId,
      newCurrentModuleId,
      newCurrentChallengeId,
    } = getNewActiveIdsAfterChallengeDeletion(
      state,
      updatedCourses,
      challengeId,
    );

    return {
      ...state,
      currentCourseId: newCurrentCourseId,
      currentModuleId: newCurrentModuleId,
      currentChallengeId: newCurrentChallengeId,
      courses: updatedCourses,
      courseSkeletons: courseSkeletons.map(c => {
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
      }),
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
  .handleAction(actions.updateCurrentChallengeBlob, (state, action) => ({
    ...state,
    blobCache: {
      ...state.blobCache,
      [action.payload.challengeId]: action.payload.dataBlob,
    },
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
  .handleAction(actions.setChallengeId, (state, action) => ({
    ...state,
    loadingCurrentBlob: true,
    displayNavigationMap: false,
    currentChallengeId: action.payload.newChallengeId,
  }))
  .handleAction(actions.fetchNavigationSkeletonSuccess, (state, action) => ({
    ...state,
    courseSkeletons: action.payload,
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
