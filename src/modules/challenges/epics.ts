import { combineEpics } from "redux-observable";
import { delay, filter, ignoreElements, map, tap } from "rxjs/operators";
import { isActionOf } from "typesafe-actions";

import { EpicSignature } from "../root";
import { Actions } from "../root-actions";
import { Course, NavigationSkeleton } from "./types";

import challenges from "../../challenges/01_programming_fundamental.json";

/** ===========================================================================
 * Epics
 * ============================================================================
 */

export const CURRENT_ACTIVE_CHALLENGE_IDS = {
  courseId: "bf2d6275-e43e-4e35-ba67-0d8c0c721458",
  moduleId: "f0aa8f00-5af8-4341-abc1-77051c68d005",
  challengeId: "88cfc98e-27bd-4044-b71e-ca947dc596da",
};

/**
 * Can also initialize the challenge id from the url to load the first
 * challenge.
 */
const challengeInitializationEpic: EpicSignature = action$ => {
  return action$.pipe(
    filter(isActionOf(Actions.initializeApp)),
    map(() => {
      /* API to fetch the current active course data ~ */
      const course = challenges as Course;
      return Actions.fetchCurrentActiveCourseSuccess({
        course,
        currentModuleId: CURRENT_ACTIVE_CHALLENGE_IDS.moduleId,
        currentCourseId: CURRENT_ACTIVE_CHALLENGE_IDS.courseId,
        currentChallengeId: CURRENT_ACTIVE_CHALLENGE_IDS.challengeId,
      });
    }),
  );
};

/**
 * Add a brief pause to display a loading overlay on top of the workspace
 * to allow Monaco to fully initialize.
 */
const setWorkspaceLoadedEpic: EpicSignature = action$ => {
  return action$.pipe(
    filter(isActionOf(Actions.fetchCurrentActiveCourseSuccess)),
    delay(1000),
    map(() => Actions.setWorkspaceChallengeLoaded()),
  );
};

/**
 * Push the current challenge id into the url.
 */
const updateChallengeRouteId: EpicSignature = (action$, state$, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.fetchCurrentActiveCourseSuccess)),
    tap(action => {
      const id = action.payload.currentChallengeId;
      const { router } = deps;
      router.push({ pathname: `/workspace/${id}` });
    }),
    ignoreElements(),
  );
};

const challengeSkeletonInitializationEpic: EpicSignature = action$ => {
  return action$.pipe(
    filter(isActionOf(Actions.initializeApp)),
    map(() => {
      /* API to fetch the challenge navigation skeleton ~ */
      const content: NavigationSkeleton = [
        {
          id: "f0aa8f00-5af8-4341-abc1-77051c68d005",
          title: "Fullstack Software Development",
          courseContent: {
            id: "bf2d6275-e43e-4e35-ba67-0d8c0c721458",
            summaryVideo: null,
            challengeContent: {
              id: "88cfc98e-27bd-4044-b71e-ca947dc596da",
              type: "typescript",
              title: "Add Two Numbers",
            },
            projectContent: null,
            projectSolution: null,
            specialTopics: null,
          },
        },
      ];

      return Actions.fetchNavigationSkeletonSuccess(content);
    }),
  );
};

const setChallengeId: EpicSignature = action$ => {
  return action$.pipe(
    filter(isActionOf(Actions.setChallengeId)),
    tap(() => {
      /* Do something here ~ */
    }),
    ignoreElements(),
  );
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default combineEpics(
  setWorkspaceLoadedEpic,
  updateChallengeRouteId,
  challengeInitializationEpic,
  challengeSkeletonInitializationEpic,
  setChallengeId,
);
