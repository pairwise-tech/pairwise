import { ChallengeList, Course } from "@pairwise/common";
import { combineEpics } from "redux-observable";
import { merge, of } from "rxjs";
import {
  catchError,
  delay,
  filter,
  ignoreElements,
  map,
  mergeMap,
  tap,
} from "rxjs/operators";
import { getType, isActionOf } from "typesafe-actions";
import { EpicSignature } from "../root";
import { Actions } from "../root-actions";
import { InverseChallengeMapping } from "./types";

/** ===========================================================================
 * Epics
 * ============================================================================
 */

export const CURRENT_ACTIVE_CHALLENGE_IDS = {
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
 * Given a list of courses, create a mapping of all challenge ids to both their
 * module id and course id. Since our URLs don't (currently) indicate course or
 * module we need to derive the course and module for a given challenge ID. This
 * dervices all such relationships in one go so it can be referenced later.
 */
const createInverseChallengeMapping = (
  courses: Course[],
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
const challengeInitializationEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf([Actions.initializeApp, Actions.logoutUser])),
    mergeMap(deps.api.fetchChallenges),
    map(({ value: course }) => {
      if (course) {
        /* Ok ... */
        const maybeId = deps.router.location.pathname.replace(
          "/workspace/",
          "",
        );

        const challengeMap = createInverseChallengeMapping([course]);
        const challengeId = maybeId || course.modules[0].challenges[0].id;
        const courseId = challengeMap[challengeId]?.courseId || course.id;
        const moduleId =
          challengeMap[challengeId]?.moduleId || course.modules[0].id;

        return Actions.fetchCurrentActiveCourseSuccess({
          courses: [course],
          currentChallengeId: challengeId,
          currentModuleId: moduleId,
          currentCourseId: courseId,
        });
      } else {
        return Actions.fetchCurrentActiveCourseFailure();
      }
    }),
  );
};

const inverseChallengeMappingEpic: EpicSignature = (action$, state$) => {
  return merge(
    action$.pipe(
      filter(isActionOf(Actions.fetchCurrentActiveCourseSuccess)),
      map(({ payload: { courses } }) => {
        const challengeMap = createInverseChallengeMapping(courses);
        return challengeMap;
      }),
    ),
    action$.pipe(
      filter(isActionOf(Actions.createChallenge)),
      map(() => state$.value.challenges.courses),
      filter(x => Boolean(x)),
      map(courses => {
        return createInverseChallengeMapping(
          courses as Course[], // TS doesn't know that this is not null due to filter above
        );
      }),
    ),
  ).pipe(
    map(challengeMap => Actions.storeInverseChallengeMapping(challengeMap)),
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
    tap(({ type, payload }) => {
      const { router } = deps;
      const id =
        typeof payload === "string" ? payload : payload.currentChallengeId;
      const redirect = () => router.push({ pathname: `/workspace/${id}` });

      /**
       * If the action causing this is fetchCurrentActiveCourseSuccess,
       * meaning the app just loaded, only redirect the user if they are
       * on the workspace/ route. Otherwise do not.
       *
       * In other cases, for setChallengeId, always redirect.
       */
      if (type === getType(Actions.fetchCurrentActiveCourseSuccess)) {
        const onWorkspace = deps.router.location.pathname.includes(
          "/workspace",
        );
        if (onWorkspace) {
          redirect();
        }
      } else {
        redirect();
      }
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
      return deps.api.codepressApi.save(payload).pipe(
        map(Actions.saveCourseSuccess),
        tap(() =>
          deps.toaster.show({
            message: "Saved 👍",
            intent: "success",
            icon: "tick",
          }),
        ),
        catchError(err =>
          of(Actions.saveCourseFailure(err)).pipe(
            tap(() => {
              deps.toaster.show({
                message: "Could not save!",
                intent: "danger",
                icon: "error",
              });
            }),
          ),
        ),
      );
    }),
  );
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default combineEpics(
  inverseChallengeMappingEpic,
  saveCourse,
  setWorkspaceLoadedEpic,
  updateChallengeRouteId,
  challengeInitializationEpic,
  setChallengeId,
);
