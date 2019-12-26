import { createReducer } from "typesafe-actions";

import insert from "ramda/es/insert";
import lensPath from "ramda/es/lensPath";
import over from "ramda/es/over";
import actions, { ActionTypes } from "./actions";
import {
  Challenge,
  Course,
  CourseList,
  InverseChallengeMapping,
  Module,
} from "./types";

const debug = require("debug")("challenge:store");

/** ===========================================================================
 * App Store
 * ============================================================================
 */

export interface State {
  workspaceLoading: boolean;
  isEditMode: boolean;
  displayNavigationMap: boolean;
  courses: Nullable<CourseList>;
  currentModuleId: Nullable<string>;
  currentCourseId: Nullable<string>;
  currentChallengeId: Nullable<string>;
  challengeMap: Nullable<InverseChallengeMapping>;
}

const initialState = {
  courses: null,
  isEditMode: false,
  workspaceLoading: true,
  currentModuleId: null,
  currentCourseId: null,
  currentChallengeId: null,
  displayNavigationMap: false,
  challengeMap: null,
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

interface ModuleInsertion {
  courseId: string;
  insertionIndex: number;
  module: Module;
}

const insertModule = (
  courses: CourseList,
  insertion: ModuleInsertion,
): CourseList => {
  const courseIndex = courses.findIndex(x => x.id === insertion.courseId);
  const lens = lensPath([courseIndex, "modules"]);
  return over(
    lens,
    insert(insertion.insertionIndex, insertion.module),
    courses,
  );
};

const challenges = createReducer<State, ActionTypes>(initialState)
  .handleAction(actions.createCourseModule, (state, action) => {
    const { module, courseId, insertionIndex } = action.payload;
    const { courses } = state;

    if (!courses) {
      return state;
    }

    return {
      ...state,
      courses: insertModule(courses, { courseId, module, insertionIndex }),
    };
  })
  .handleAction(actions.updateChallenge, (state, action) => {
    const { courses } = state;
    const { id, challenge } = action.payload;
    const mapping = state.challengeMap?.[id];

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
  .handleAction(actions.setEditMode, (state, action) => ({
    ...state,
    isEditMode: action.payload,
  }))
  .handleAction(actions.setWorkspaceChallengeLoaded, (state, action) => ({
    ...state,
    workspaceLoading: false,
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
    displayNavigationMap: false,
    currentChallengeId: action.payload,
  }))
  .handleAction(actions.fetchNavigationSkeletonSuccess, (state, action) => ({
    ...state,
    courses: action.payload,
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
