import shortid from "shortid";
import { compose } from "redux";
import {
  Module,
  Challenge,
  assertUnreachable,
  CodeChallengeBlob,
  VideoChallengeBlob,
  DataBlob,
  SandboxBlob,
  CHALLENGE_TYPE,
  CHALLENGE_PROGRESS,
  ChallengeSkeleton,
  ChallengeSkeletonList,
  ProjectChallengeBlob,
  CourseList,
  Course,
  UserProgressMap,
  CourseSkeleton,
} from "@pairwise/common";
import { SANDBOX_ID } from "./constants";
import { Location } from "history";
import { IconName } from "@blueprintjs/core";
import { InverseChallengeMapping } from "modules/challenges/types";
import { ParsedQuery } from "query-string";

/** ===========================================================================
 * Utils
 * ============================================================================
 */

/**
 * Artificially wait the provided amount of time.
 */
export const wait = async (time: number = 1000) => {
  await new Promise((_: any) => setTimeout(_, time));
};

/**
 * A compose function which passes only props information for better
 * type-checking.
 */
export const composeWithProps = <T extends {}>(
  ...fns: any
): ((component: any) => (props: T) => any) => {
  return compose(...fns);
};

/**
 * Determine if a challenge should only show content (no code editor).
 */
export const isContentOnlyChallenge = (challenge: Challenge) => {
  const { type } = challenge;
  return (
    type === "media" ||
    type === "section" ||
    type === "project" ||
    type === "guided-project" ||
    type === "special-topic"
  );
};

/**
 * Determine if a challenge requires the workspace (code editor).
 */
export const challengeRequiresWorkspace = (challenge: Challenge) => {
  const contentOnlyChallenge = isContentOnlyChallenge(challenge);
  return !contentOnlyChallenge;
};

/**
 * Given a challenge and other relevant data, construct the
 * data blob to represent the user's progress on that challenge.
 */
export const constructDataBlobFromChallenge = (args: {
  code: string;
  challenge: Challenge;
}): DataBlob => {
  const { code, challenge } = args;

  if (challenge.id === SANDBOX_ID) {
    const blob: SandboxBlob = {
      code,
      type: "sandbox",
      challengeType: challenge.type,
    };
    return blob;
  }

  switch (challenge.type) {
    case "section":
    case "react":
    case "typescript":
    case "markup": {
      const blob: CodeChallengeBlob = {
        code,
        type: "challenge",
      };
      return blob;
    }
    case "guided-project":
    case "special-topic":
    case "media": {
      const blob: VideoChallengeBlob = {
        type: "video",
        timeLastWatched: 0,
      };
      return blob;
    }
    case "project": {
      const blob: ProjectChallengeBlob = {
        type: "project",
        url: "",
        repo: "",
        timeLastWatched: 0,
      };
      return blob;
    }
    default: {
      assertUnreachable(challenge.type);
    }
  }
};

// Restrict shortid to only friendly-looking characters for nicer-looking ids
shortid.characters(
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@",
);

export const generateEmptyModule = (): Module => ({
  id: shortid.generate(),
  title: "[EMPTY...]",
  challenges: [],
  free: false /* All challenges are locked by default */,
});

const starterTestCode = `test("Write your test assertion here", () => {
  expect(true).toBe(true);
});
`;

export const generateEmptyChallenge = (
  overwrite: Partial<Challenge> = {},
): Challenge => ({
  id: shortid.generate(),
  type: "typescript",
  title: "[EMPTY...]",
  instructions: "",
  testCode: starterTestCode,
  videoUrl: "",
  starterCode: "",
  solutionCode: "",
  content: "",
  ...overwrite,
});

export const defaultSandboxChallenge = generateEmptyChallenge({
  id: SANDBOX_ID, // Important. This is how the app knows it's the sandbox challenge
  title: "Sandbox",
  type: "markup",
});

export const defaultSandboxBlob = constructDataBlobFromChallenge({
  code: "",
  challenge: defaultSandboxChallenge,
});

/**
 * Get the appropriate icon from a challenge based on the challenge type.
 */
export const getChallengeIcon = (
  type: CHALLENGE_TYPE,
  userCanAccess: boolean,
  challengeProgress?: CHALLENGE_PROGRESS,
): IconName => {
  if (
    challengeProgress &&
    type !== "section" &&
    challengeProgress === "COMPLETE"
  ) {
    return "tick";
  }

  if (!userCanAccess) {
    return "lock";
  }

  if (type === "section") {
    return "caret-down";
  } else if (type === "media") {
    return "book";
  } else {
    return "code";
  }
};

export const getChallengeProgress = (
  userProgressMap: Nullable<UserProgressMap>,
  courseId: string,
  challengeId: string,
): CHALLENGE_PROGRESS => {
  if (
    userProgressMap &&
    userProgressMap[courseId] &&
    userProgressMap[courseId][challengeId]
  ) {
    if (userProgressMap[courseId][challengeId].complete) {
      return "COMPLETE";
    }
    return "INCOMPLETE";
  }
  return "NOT_ATTEMPTED";
};

export const getSectionProgress = (
  sectionChallenges: ChallengeSkeleton[],
  userProgressMap: Nullable<UserProgressMap>,
  courseId: string,
) => {
  return sectionChallenges.reduce(
    (acc, { id }) =>
      getChallengeProgress(userProgressMap, courseId, id) === "COMPLETE"
        ? acc + 1
        : acc,
    0,
  );
};

export interface NavigationChallengeSection {
  section: Nullable<ChallengeSkeleton>;
  challenges: ChallengeSkeleton[];
}

/**
 * Behold, the great challenge partitioning method!
 *
 * This method partitions a list of challenge into blocks of challenges by
 * section challenges which exist in the challenge list.
 *
 * It takes all challenges in a section, until the next section (or until
 * a non-challenge type is encountered) and groups them into a block. These
 * can then be rendered in a way that allow the sections to be separately
 * collapsed and expanded.
 *
 * The behavior may change in the future, especially around projects and
 * special topics.
 *
 * Sean is responsible for this!
 */
export const partitionChallengesBySection = (
  challengeList: ChallengeSkeletonList,
) => {
  const defaultSection: NavigationChallengeSection = {
    section: null,
    challenges: [],
  };

  let currentSection = defaultSection;
  let firstReachedSpecialTopics = false;
  let sections: NavigationChallengeSection[] = [];

  for (const challenge of challengeList) {
    const { type } = challenge;

    const SHOULD_END_SECTION = type === "section";
    const reachedSpecialTopics = type === "special-topic";

    const SPECIAL_TOPIC_BOUNDARY =
      reachedSpecialTopics && !firstReachedSpecialTopics;

    const CURRENT_SECTION_HAS_CONTENT =
      !!currentSection.section || currentSection.challenges.length > 0;

    if (SPECIAL_TOPIC_BOUNDARY) {
      if (CURRENT_SECTION_HAS_CONTENT) {
        sections = sections.concat(currentSection);
      }
      const nextSection: NavigationChallengeSection = {
        section: null,
        challenges: [challenge],
      };
      firstReachedSpecialTopics = true;
      currentSection = nextSection;
    } else if (SHOULD_END_SECTION) {
      if (CURRENT_SECTION_HAS_CONTENT) {
        sections = sections.concat(currentSection);
      }

      const nextSection: NavigationChallengeSection = {
        section: challenge,
        challenges: [],
      };
      currentSection = nextSection;
    } else {
      currentSection = {
        section: currentSection.section,
        challenges: currentSection.challenges.concat(challenge),
      };
    }
  }

  /* Add whatever last challenges remain and were not aggregated yet */
  sections = sections.concat(currentSection);

  return sections;
};

/**
 * Find a course by id in the course list.
 */
export const findCourseById = (courseId: string, courses: CourseList) => {
  const course = courses.find(c => c.id === courseId);
  return course;
};

/**
 * Given a list of courses, create a mapping of all challenge ids to both their
 * module id and course id. Since our URLs don't (currently) indicate course or
 * module we need to derive the course and module for a given challenge ID. This
 * derives all such relationships in one go so it can be referenced later.
 */
export const createInverseChallengeMapping = (
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
 * Get a challenge id from a workspace url path.
 */
export const findChallengeIdInLocationIfExists = ({
  pathname,
}: Location): string => {
  return pathname.replace("/workspace/", "");
};

/**
 * Given a course and a possible default challenge id, derive the course,
 * module, and challenge ids to set as active in the Workspace. Falls back
 * to sensible default options.
 */
export const deriveIdsFromCourse = (
  courses: CourseList,
  maybeChallengeId: string,
) => {
  const defaultCourse = courses[0];
  const challengeMap = createInverseChallengeMapping(courses);
  const challengeId =
    maybeChallengeId in challengeMap
      ? maybeChallengeId
      : maybeChallengeId === SANDBOX_ID
      ? maybeChallengeId
      : defaultCourse.modules[0].challenges[0].id;
  const courseId = challengeMap[challengeId]?.courseId || defaultCourse.id;
  const moduleId =
    challengeMap[challengeId]?.moduleId || defaultCourse.modules[0].id;

  return {
    courseId,
    moduleId,
    challengeId,
  };
};

/**
 * Map the course skeletons when fetched in DEV mode. This just transforms
 * the skeletons so all the content is available in development.
 */
export const mapCourseSkeletonInDev = (courseSkeleton: CourseSkeleton) => {
  return {
    ...courseSkeleton,
    modules: courseSkeleton.modules.map(m => {
      return {
        ...m,
        free: true,
        userCanAccess: true,
        challenges: m.challenges.map(c => {
          return {
            ...c,
            userCanAccess: true,
          };
        }),
      };
    }),
  };
};

// Definition of specific types to identify different states for the
// initial app load:
export enum APP_INITIALIZATION_TYPE {
  DEFAULT = "DEFAULT",

  // Special types:
  SIGN_IN = "SIGN_IN",
  ACCOUNT_CREATED = "ACCOUNT_CREATED",
  PAYMENT_SUCCESS = "PAYMENT_SUCCESS",
  PAYMENT_CANCELLED = "PAYMENT_CANCELLED",
  AUTHENTICATION_FAILURE = "AUTHENTICATION_FAILURE",
}

// Check a list of param keys exists in the parsed query params from a url
const checkParamsExist = (params: ParsedQuery<string>, keys: string[]) => {
  for (const key of keys) {
    if (params[key] === undefined) {
      return false;
    }
  }

  return true;
};

// Parse the initial url and params which may have loaded the app and
// return the APP_INITIALIZATION_TYPE enum which specifically
// categorizes the app initialization type. This is then used to trigger
// other events in the app based on the initialization state.
export const parseInitialUrlToInitializationType = (
  path: string,
  params: ParsedQuery<string>,
): APP_INITIALIZATION_TYPE => {
  // A user authenticated:
  if (
    path === "/authenticated" &&
    checkParamsExist(params, ["accessToken", "accountCreated"])
  ) {
    if (params.accountCreated === "true") {
      return APP_INITIALIZATION_TYPE.ACCOUNT_CREATED;
    } else {
      return APP_INITIALIZATION_TYPE.SIGN_IN;
    }
  }

  // There was some error during authentication.
  if (
    path === "/authentication-failure" &&
    checkParamsExist(params, ["strategy"])
  ) {
    return APP_INITIALIZATION_TYPE.AUTHENTICATION_FAILURE;
  }

  // A user returned from the checkout flow after cancelling:
  if (path === "/payment-cancelled") {
    return APP_INITIALIZATION_TYPE.PAYMENT_CANCELLED;
  }

  // A user returned from the checkout flow after payment success:
  if (path === "/payment-success" && checkParamsExist(params, ["courseId"])) {
    return APP_INITIALIZATION_TYPE.PAYMENT_SUCCESS;
  }

  // Default category:
  return APP_INITIALIZATION_TYPE.DEFAULT;
};

// Format a date, e.g. 2020-02-15T13:10:18.920Z -> Saturday, February 15, 2020
export const formatDate = (rawDate: Date) => {
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  const date = new Date(rawDate);
  const formatted = date.toLocaleDateString("en-US", options);
  return formatted;
};

export const logWhatChanged = (
  a: { [k: string]: any },
  b: { [k: string]: any },
) => {
  Object.keys(b)
    .filter(key => {
      return a[key] !== b[key];
    })
    .forEach(key => {
      const ax = a[key];
      const bx = b[key];
      console.log(
        "changed property:",
        key,
        "from",
        typeof ax === "function" ? "[FUNC A]" : ax,
        "to",
        typeof bx === "function" ? "[FUNC B]" : bx,
      );
    });
};

// Get an appropriate name and file extensionbased on a challenge type
export const getFileMetaByChallengeType = (x: CHALLENGE_TYPE) => {
  const name = "index";

  switch (x) {
    case "markup":
      return {
        ext: "html",
        name,
      };
    case "react":
      return {
        ext: "tsx",
        name,
      };
    case "typescript":
      return {
        ext: "ts",
        name,
      };
    case "media":
    case "section":
    case "project":
    case "guided-project":
    case "special-topic":
      return null;
    default:
      assertUnreachable(x);
      break;
  }
};

// Copy some text to the clipboard
export const copyToClipboard = (text: string) => {
  const el = document.createElement("textarea");
  el.value = text;
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
};
