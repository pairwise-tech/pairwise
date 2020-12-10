import { validate as validateEmail } from "email-validator";
import { compose } from "redux";
import { CourseList, CourseSkeleton } from "@pairwise/common";
import { ParsedQuery } from "query-string";
import { AdminUserView } from "../modules/users/store";
import toaster from "../tools/toast-utils";
import { AdminSearchResult } from "../components/AdminSearchPage";

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

type OS = "Mac" | "iOS" | "Windows" | "Android" | "Linux";

/**
 * Determine client OS, code from this StackOverflow post:
 * https://stackoverflow.com/questions/38241480/detect-macos-ios-windows-android-and-linux-os-with-js
 */
export const getClientOS = (): Nullable<OS> => {
  const userAgent = window.navigator.userAgent;
  const platform = window.navigator.platform;
  const macPlatforms = new Set(["Macintosh", "MacIntel", "MacPPC", "Mac68K"]);
  const windowsPlatforms = new Set(["Win32", "Win64", "Windows", "WinCE"]);
  const iosPlatforms = new Set(["iPhone", "iPad", "iPod"]);
  let os: Nullable<OS> = null;

  if (macPlatforms.has(platform)) {
    os = "Mac";
  } else if (iosPlatforms.has(platform)) {
    os = "iOS";
  } else if (windowsPlatforms.has(platform)) {
    os = "Windows";
  } else if (/Android/.test(userAgent)) {
    os = "Android";
  } else if (!os && /Linux/.test(platform)) {
    os = "Linux";
  }

  return os;
};

/**
 * Find a course by id in the course list.
 */
export const findCourseById = (courseId: string, courses: CourseList) => {
  const course = courses.find(c => c.id === courseId);
  return course;
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
  EMAIL_UPDATED = "EMAIL_UPDATED",
  ACCOUNT_CREATED = "ACCOUNT_CREATED",
  PAYMENT_SUCCESS = "PAYMENT_SUCCESS",
  PAYMENT_CANCELLED = "PAYMENT_CANCELLED",
  PURCHASE_COURSE_FLOW = "PURCHASE_COURSE_FLOW",
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
  if (checkParamsExist(params, ["accessToken", "accountCreated"])) {
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

  // Default category:
  return APP_INITIALIZATION_TYPE.DEFAULT;
};

/**
 * Parse the course progress.
 */
const formatChallengeProgress = (progressHistory: any) => {
  return progressHistory.map((p: any) => ({
    ...p,
    progress: JSON.parse(p.progress),
  }));
};

/**
 * Count the total completed challenges for a user.
 */
const countCompletedChallenges = (progress: any) => {
  return progress.reduce(
    (summary: { total: number }, courseProgress: any) => {
      const count = Object.keys(courseProgress.progress).length;
      return {
        ...summary,
        total: summary.total + count,
        [courseProgress.courseId]: count,
      };
    },
    { total: 0 },
  );
};

/**
 * Remove some extra user fields to make the JSON output easier to read.
 */
const removeExcessUserFields = (user: AdminUserView) => {
  return {
    uuid: user.uuid,
    email: user.email,
    displayName: user.displayName,
    givenName: user.givenName,
    familyName: user.familyName,
    settings: user.settings,
    payments: user.payments,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

// Whitelist our emails
const WHITELISTED_EMAILS = new Set([
  "sean.smith.2009@gmail.com",
  "pweinberg633@gmail.com",
  "ian989@gmail.com",
  "ian@iansinnott.com",
]);

// Whitelist some users who don't have an email
const WHITELIST_UUID_LIST = new Set([
  "89794e45-ee52-424e-9d79-77e1da64d7a0", // Ian
  "cf26bc29-1591-479e-bb58-241c255cc331", // Peter
]);

/**
 * Remove ourselves from the user list.
 */
const filterUsOut = (user: AdminUserView) => {
  const { email, uuid } = user;
  if (!email) {
    return true;
  }

  const excludeUser =
    WHITELIST_UUID_LIST.has(uuid) ||
    WHITELISTED_EMAILS.has(email) ||
    email.includes("@pairwise.tech");

  if (excludeUser) {
    return false;
  } else {
    return true;
  }
};

export const summarizeUserProgress = (users: AdminUserView[]) => {
  const withProgressSummaries = users.filter(filterUsOut).map(user => {
    // Format the progress history
    const formattedProgress = formatChallengeProgress(
      user.challengeProgressHistory,
    );

    // Get all completed challenges count
    const completedChallenges = countCompletedChallenges(formattedProgress);

    // Get completed challenges
    const completedChallengeList = formattedProgress.reduce(
      (result: any, courseProgress: any) =>
        result.concat(Object.values(courseProgress.progress)),
      [],
    );

    // Get only the completed challenge ids
    const completedChallengeIds = formattedProgress.reduce(
      (result: any, courseProgress: any) =>
        result.concat(Object.keys(courseProgress.progress)),
      [],
    );

    return {
      ...removeExcessUserFields(user),
      completedChallenges,
      completedChallengeList,
      completedChallengeIds,
    };
  });

  // Sort by completed challenge count
  const sortedByCompletedChallenges = withProgressSummaries.sort((a, b) => {
    return b.completedChallenges.total - a.completedChallenges.total;
  });

  // Record some stats
  let totalChallengesCompleted = 0;
  let challengesCompletedInLastWeek = 0;
  let newUsersInLastWeek = 0;
  let usersWithoutEmail = 0;
  let leaderChallengeCount = 0;
  let numberOfUsersWithZeroChallengesComplete = 0;
  let nonZeroChallengeUsers = 0;

  for (const user of withProgressSummaries) {
    const { completedChallengeList } = user;
    const now = Date.now();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const lastWeek = now - oneWeek;

    leaderChallengeCount = Math.max(
      leaderChallengeCount,
      completedChallengeList.length,
    );

    if (!user.email) {
      usersWithoutEmail++;
    }

    if (completedChallengeList.length === 0) {
      numberOfUsersWithZeroChallengesComplete++;
    } else {
      nonZeroChallengeUsers++;
    }

    const userCreated = new Date(user.createdAt).getTime();
    if (userCreated > lastWeek) {
      newUsersInLastWeek++;
    }

    for (const challenge of completedChallengeList) {
      totalChallengesCompleted++;

      if (!!challenge.timeCompleted) {
        const challengeCompleted = new Date(challenge.timeCompleted).getTime();
        if (challengeCompleted > lastWeek) {
          challengesCompletedInLastWeek++;
        }
      }
    }

    delete user.completedChallengeList;
  }

  const totalUsers = sortedByCompletedChallenges.length;

  // The average challenge completed count excludes users with zero
  // challenges completed
  const averageChallengesCompletedPerNonZeroUser = Math.round(
    totalChallengesCompleted / nonZeroChallengeUsers,
  );

  // Create summary with total user count
  const summary = {
    stats: {
      totalUsers,
      newUsersInLastWeek,
      usersWithoutEmail,
      totalChallengesCompleted,
      challengesCompletedInLastWeek,
    },
    leaderboard: {
      leaderChallengeCount,
      averageChallengesCompletedPerNonZeroUser,
      numberOfUsersWithZeroChallengesComplete,
    },
    users: sortedByCompletedChallenges,
  };

  return summary;
};

export const copyToClipboard = (text: Nullable<string>) => {
  if (text) {
    navigator.clipboard.writeText(text).then(() => {
      toaster.success(`Copied: ${text}`);
    });
  }
};

/**
 * Parse an admin search query with simple logic.
 */
export const parseSearchQuery = (
  query: string,
): Nullable<AdminSearchResult> => {
  if (!query) {
    return null;
  }

  if (validateEmail(query)) {
    return { type: "email", value: query };
  } else if (query.length < 10) {
    return { type: "challengeId", value: query };
  } else {
    return { type: "uuid", value: query };
  }
};
