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
const challengeInitializationEpic: EpicSignature = (action$, state$, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.initializeApp)),
    map(() => {
      /* Ok ... */
      const maybeId = deps.router.location.pathname.replace("/workspace/", "");
      const challengeExists = challenges.challenges.find(c => c.id === maybeId);
      const challengeId = challengeExists
        ? challengeExists.id
        : CURRENT_ACTIVE_CHALLENGE_IDS.challengeId;

      /* API to fetch the current active course data ~ */
      const course = challenges as Course;
      return Actions.fetchCurrentActiveCourseSuccess({
        course,
        currentChallengeId: challengeId,
        currentModuleId: CURRENT_ACTIVE_CHALLENGE_IDS.moduleId,
        currentCourseId: CURRENT_ACTIVE_CHALLENGE_IDS.courseId,
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
    filter(
      isActionOf([
        Actions.setChallengeId,
        Actions.fetchCurrentActiveCourseSuccess,
      ]),
    ),
    tap(({ payload }) => {
      const id =
        typeof payload === "string" ? payload : payload.currentChallengeId;
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

      const challengeContent = challenges.challenges.map(c => ({
        id: c.id,
        type: c.type,
        title: c.title,
      }));

      const content: NavigationSkeleton = [
        {
          id: "f0aa8f00-5af8-4341-abc1-77051c68d005",
          title: "Fullstack Software Development",
          courseContent: {
            challengeContent,
            summaryVideo: null,
            specialTopics: null,
            projectContent: null,
            projectSolution: null,
            id: "bf2d6275-e43e-4e35-ba67-0d8c0c721458",
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
