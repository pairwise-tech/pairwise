import axios from "axios";
import { combineEpics } from "redux-observable";
import {
  delay,
  filter,
  ignoreElements,
  map,
  mergeMap,
  tap,
} from "rxjs/operators";
import { isActionOf } from "typesafe-actions";

import { EpicSignature } from "../root";
import { Actions } from "../root-actions";
import { ChallengeList, Course } from "./types";

import FullstackTypeScriptCourseJSON from "../../challenges/01_programming_fundamental.json";

const FullstackTypeScriptCourse = FullstackTypeScriptCourseJSON as Course;

/** ===========================================================================
 * Epics
 * ============================================================================
 */

export const CURRENT_ACTIVE_CHALLENGE_IDS = {
  courseId: "fpvPtfu7s",
  moduleId: "fpvPtNWkC",
  challengeId: "9scykDold",
};

const getAllChallengesInCourse = (course: Course): ChallengeList => {
  let challenges: ChallengeList = [];
  course.modules.forEach(module => {
    challenges = challenges.concat(module.challenges);
  });
  return challenges;
};

/**
 * Can also initialize the challenge id from the url to load the first
 * challenge.
 */
const challengeInitializationEpic: EpicSignature = (action$, state$, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.initializeApp)),
    mergeMap(async () => {
      /* Ok ... */
      const maybeId = deps.router.location.pathname.replace("/workspace/", "");
      const challenges = getAllChallengesInCourse(FullstackTypeScriptCourse);
      const challengeExists = challenges.find(c => c.id === maybeId);
      const challengeId = challengeExists
        ? challengeExists.id
        : CURRENT_ACTIVE_CHALLENGE_IDS.challengeId;

      try {
        const result = await axios.get("http://localhost:9000/challenges");

        return Actions.fetchCurrentActiveCourseSuccess({
          courses: [result.data],
          currentChallengeId: challengeId,
          currentModuleId: CURRENT_ACTIVE_CHALLENGE_IDS.moduleId,
          currentCourseId: CURRENT_ACTIVE_CHALLENGE_IDS.courseId,
        });
      } catch (err) {
        return Actions.fetchCurrentActiveCourseFailure();
      }
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
  setChallengeId,
);
