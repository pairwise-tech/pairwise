import { createReducer } from "typesafe-actions";

import {
  Challenge,
  CourseList,
  CourseSkeletonList,
  DataBlob,
} from "@pairwise/common";
import Module from "module";
import insert from "ramda/es/insert";
import lensPath from "ramda/es/lensPath";
import over from "ramda/es/over";
import actions, { ActionTypes } from "./actions";
import AppActions, { ActionTypes as AppActionTypes } from "../app/actions";
import {
  ChallengeCreationPayload,
  InverseChallengeMapping,
  ModuleCreationPayload,
  MonacoEditorOptions,
} from "./types";
import { SANDBOX_ID, MONACO_EDITOR_INITIAL_FONT_SIZE } from "tools/constants";
import { defaultSandboxChallenge } from "tools/utils";

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
  editorOptions: MonacoEditorOptions;
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
  editorOptions: {
    fontSize: MONACO_EDITOR_INITIAL_FONT_SIZE,
  },
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
  insertion: ModuleCreationPayload,
): CourseList => {
  const courseIndex = courses.findIndex(x => x.id === insertion.courseId);
  const lens = lensPath([courseIndex, "modules"]);
  return over(
    lens,
    insert(insertion.insertionIndex, insertion.module),
    courses,
  );
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

const challenges = createReducer<State, ActionTypes | AppActionTypes>(
  initialState,
)
  .handleAction(actions.createChallenge, (state, action) => {
    const { courses } = state;

    if (!courses) {
      return state;
    }

    return {
      ...state,
      courses: insertChallenge(courses, action.payload),
    };
  })
  .handleAction(actions.createCourseModule, (state, action) => {
    const { courses } = state;

    if (!courses) {
      return state;
    }

    return {
      ...state,
      courses: insertModule(courses, action.payload),
    };
  })
  .handleAction(actions.updateChallenge, (state, action) => {
    const { courses } = state;
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
    };
  })
  .handleAction(actions.updateCourseModule, (state, action) => {
    const { courses } = state;

    if (!courses) {
      return state;
    }

    return {
      ...state,
      courses: updateModule(courses, action.payload),
    };
  })
  .handleAction(actions.updateEditorOptions, (state, action) => ({
    ...state,
    editorOptions: {
      ...state.editorOptions,
      ...action.payload,
    },
  }))
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
  .handleAction(AppActions.locationChange, (state, action) => ({
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
