import { combineEpics } from "redux-observable";
import { filter, map, mergeMap, pluck, tap } from "rxjs/operators";
import { isActionOf } from "typesafe-actions";
import { EpicSignature } from "../root";
import { Actions } from "../root-actions";
import { createInverseChallengeMapping } from "@pairwise/common";

/** ===========================================================================
 * Epics
 * ============================================================================
 */

/**
 * Fetch the course content skeletons when the app launches.
 */
const contentSkeletonInitializationEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.initializeApp)),
    mergeMap(deps.api.fetchCourseSkeletons),
    map(({ value: courses, error }) => {
      if (courses) {
        return Actions.fetchNavigationSkeletonSuccess(courses);
      } else {
        return Actions.fetchNavigationSkeletonFailure(error);
      }
    }),
  );
};

/**
 * Fetch the courses.
 */
const challengeInitializationEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.storeAccessTokenSuccess)),
    mergeMap(deps.api.fetchCourses),
    map(({ value: courses }) => {
      if (courses) {
        return Actions.fetchCoursesSuccess({ courses });
      } else {
        return Actions.fetchCoursesFailure();
      }
    }),
  );
};

const inverseChallengeMappingEpic: EpicSignature = (action$, state$) => {
  return action$.pipe(
    filter(isActionOf(Actions.fetchCoursesSuccess)),
    map(({ payload: { courses } }) => {
      const challengeMap = createInverseChallengeMapping(courses);
      return Actions.storeInverseChallengeMapping(challengeMap);
    }),
  );
};

/**
 * Fetch the diff context for a pull request id number.
 */
const fetchPullRequestContextEpic: EpicSignature = (action$, state$, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.fetchPullRequestContext)),
    pluck("payload"),
    mergeMap(deps.api.fetchPullRequestContext),
    map(({ value, error }) => {
      if (value) {
        return Actions.fetchPullRequestContextSuccess(value);
      } else {
        deps.toaster.warn("Failed to fetch pull request context...");
        return Actions.fetchPullRequestContextFailure(error);
      }
    }),
  );
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default combineEpics(
  contentSkeletonInitializationEpic,
  challengeInitializationEpic,
  inverseChallengeMappingEpic,
  fetchPullRequestContextEpic,
);
