import API from "modules/api";
import { combineEpics } from "redux-observable";
import { of } from "rxjs";
import {
  catchError,
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
import {
  ChallengeList,
  Course,
  CourseList,
  InverseChallengeMapping,
} from "./types";

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

const createInverseChallengeMapping = (
  courses: CourseList,
): InverseChallengeMapping => {
  const result = courses.reduce((challengeMap, c) => {
    const courseId = c.id;
    const cx = c.modules.reduce((courseChallengeMap, m) => {
      const moduleId = m.id;
      const mx = m.challenges.reduce((moduleChallengeMap, challenge) => {
        return {
          ...moduleChallengeMap,
          [challenge.id]: {
            moduleId,
            courseId,
          },
        };
      }, {});

      return {
        ...courseChallengeMap,
        ...mx,
      };
    }, {});

    return {
      ...challengeMap,
      ...cx,
    };
  }, {});

  return result;
};

/**
 * Can also initialize the challenge id from the url to load the first
 * challenge.
 */
const challengeInitializationEpic: EpicSignature = (action$, state$, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.initializeApp)),
    mergeMap(API.fetchChallenges),
    mergeMap(result => {
      const { value } = result;
      if (value) {
        const course = value;
        /* Ok ... */
        const maybeId = deps.router.location.pathname.replace(
          "/workspace/",
          "",
        );

        const challengeMap = createInverseChallengeMapping([course]);
        const challenges = getAllChallengesInCourse(course);
        const challengeExists = challenges.find(c => c.id === maybeId);
        const challengeId = challengeExists
          ? challengeExists.id
          : CURRENT_ACTIVE_CHALLENGE_IDS.challengeId;

        return [
          Actions.storeInverseChallengeMapping(challengeMap),
          Actions.fetchCurrentActiveCourseSuccess({
            courses: [course],
            currentChallengeId: challengeId,
            currentModuleId: CURRENT_ACTIVE_CHALLENGE_IDS.moduleId,
            currentCourseId: CURRENT_ACTIVE_CHALLENGE_IDS.courseId,
          }),
        ];
      } else {
        return [Actions.fetchCurrentActiveCourseFailure()];
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

const saveCourse: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.saveCourse)),
    map(x => x.payload),
    mergeMap(payload => {
      return deps.course.save(payload).pipe(
        map(Actions.saveCourseSuccess),
        catchError(err => of(Actions.saveCourseFailure(err))),
      );
    }),
  );
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default combineEpics(
  saveCourse,
  setWorkspaceLoadedEpic,
  updateChallengeRouteId,
  challengeInitializationEpic,
  setChallengeId,
);
