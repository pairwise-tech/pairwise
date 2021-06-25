import { combineEpics } from "redux-observable";
import {
  filter,
  ignoreElements,
  map,
  mergeMap,
  tap,
  pluck,
} from "rxjs/operators";
import { isActionOf } from "typesafe-actions";
import { EpicSignature } from "../root";
import { Actions } from "../root-actions";
import { createInverseChallengeMapping } from "@pairwise/common";
import { parseSearchQuery } from "../../tools/admin-utils";
import { AdminSearchResult } from "../../components/AdminSearchPage";

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
 * Fetch the pull request content on app load, if there the url
 * includes a pull request id.
 */
const fetchPullRequestContextOnAppLoadEpic: EpicSignature = action$ => {
  return action$.pipe(
    filter(isActionOf(Actions.initializeApp)),
    map(() => window.location.pathname),
    filter(x => x.includes("pull-requests")),
    map(path => Actions.handleSearchPullRequest(path)),
  );
};

const fetchChallengeMetaIfSearchIsChallengeId = (path: string) => {
  if (path.includes("/search/")) {
    const query = parseSearchQuery(path.split("/")[2]);
    if (query) {
      const { type, value } = query;
      if (type === "challengeId") {
        return Actions.fetchChallengeMeta(value);
      }
    }
  }

  return Actions.empty("No challengeId present in search.");
};

const handleChallengeIdSearchInitializationEpic: EpicSignature = (
  action$,
  state$,
  deps,
) => {
  return action$.pipe(
    filter(isActionOf(Actions.captureAppInitializationUrl)),
    pluck("payload"),
    pluck("location"),
    pluck("pathname"),
    map(fetchChallengeMetaIfSearchIsChallengeId),
  );
};

const handleChallengeIdSearchEpic: EpicSignature = (action$, state$, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.locationChange)),
    pluck("payload"),
    pluck("pathname"),
    map(fetchChallengeMetaIfSearchIsChallengeId),
  );
};

/**
 * Fetch challenge meta for a challenge.
 */
const fetchChallengeMetaEpic: EpicSignature = (action$, state$, deps) => {
  return action$.pipe(
    filter(
      isActionOf([Actions.fetchChallengeMeta, Actions.setChallengeDetailId]),
    ),
    map(x => x.payload),
    // @ts-ignore
    filter(x => x !== null),
    mergeMap(deps.api.fetchChallengeMeta),
    map(({ value: meta, error }) => {
      if (meta) {
        return Actions.fetchChallengeMetaSuccess(meta);
      } else {
        return Actions.fetchChallengeMetaFailure(error);
      }
    }),
  );
};

/**
 * Trigger a search for a pull request diff when the pull id in the url
 * changes.
 */
const searchPullRequestContextEpic: EpicSignature = (action$, state$, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.locationChange)),
    pluck("payload"),
    pluck("pathname"),
    filter(x => x.includes("/pull-requests/")),
    map(path => Actions.handleSearchPullRequest(path)),
  );
};

/**
 * Parse a possible pull request id and handle fetching the pull request
 * context.
 */
const handleSearchPullRequestEpic: EpicSignature = (action$, state$, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.handleSearchPullRequest)),
    pluck("payload"),
    map(path => {
      const idParam = path.split("/")[2];
      const id = Number(idParam);
      if (!id || isNaN(id)) {
        // Do not alert if there is no id param
        if (!!id) {
          deps.toaster.warn("Invalid pull id provided - must be a number!");
        }
        return Actions.empty(
          "Route change occurred by there is an invalid pull request id.",
        );
      } else {
        return Actions.fetchPullRequestContext(id);
      }
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
  searchPullRequestContextEpic,
  handleChallengeIdSearchInitializationEpic,
  handleChallengeIdSearchEpic,
  fetchChallengeMetaEpic,
  handleSearchPullRequestEpic,
  fetchPullRequestContextEpic,
  fetchPullRequestContextOnAppLoadEpic,
);
