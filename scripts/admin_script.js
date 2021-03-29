const fs = require("fs");
const axios = require("axios");

/** ===========================================================================
 * Admin API scripting lifestyles!
 * ----------------------------------------------------------------------------
 * This needs to be fully removed once a proper admin UI exists. This is
 * a temporary measure to allow us to conduct admin API actions using a
 * hard-coded access token in the production server.
 *
 * Be careful with this!!!
 *
 * Example usage:
 *
 * SCRIPT_ACTION=REFUND USER_EMAIL=user_email@gmail.com COURSE_ID=fpvPtfu7s node admin_script.js
 *
 * ============================================================================
 */

// Read environment variables
const SERVER_URL = process.env.SERVER_URL || "http://localhost:9000";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "local_admin_token";
const COURSE_ID = process.env.COURSE_ID;
const USER_EMAIL = process.env.USER_EMAIL;
const USER_UUID = process.env.USER_UUID;
const SCRIPT_ACTION = process.env.SCRIPT_ACTION;

console.log(`\n- Running admin script! Received environment config:\n`);
console.log(`- SCRIPT_ACTION: ${SCRIPT_ACTION}`);
console.log(`- COURSE_ID: ${COURSE_ID}`);
console.log(`- USER_EMAIL: ${USER_EMAIL}`);
console.log(`- USER_UUID: ${USER_UUID}`);
console.log(`- SERVER_URL: ${SERVER_URL}`);
console.log(`- ADMIN_TOKEN: ${ADMIN_TOKEN.slice(0, 25)}...`);
console.log(`\nRunning script!\n`);

// Valid script actions:
const TEST = "TEST";
const PURCHASE = "PURCHASE";
const REFUND = "REFUND";
const GET_USERS = "GET_USERS";
const GET_USER = "GET_USER";
const DELETE_USER_BY_EMAIL = "DELETE_USER_BY_EMAIL";
const DELETE_USER_BY_UUID = "DELETE_USER_BY_UUID";
const VALID_ACTIONS = new Set([
  TEST,
  PURCHASE,
  REFUND,
  GET_USERS,
  GET_USER,
  DELETE_USER_BY_EMAIL,
  DELETE_USER_BY_UUID,
]);

const validateActionType = actionType => {
  if (VALID_ACTIONS.has(actionType)) {
    console.log(`Running Admin script for action type: ${SCRIPT_ACTION}`);
    return true;
  }

  throw new Error(`Invalid action received! -> ${SCRIPT_ACTION}`);
};

// Validate the requested action
validateActionType(SCRIPT_ACTION);

// Admin Request Headers
const RequestHeaders = {
  headers: {
    admin_access_token: ADMIN_TOKEN,
  },
};

// Admin API urls
const ADMIN_INDEX_URL = `${SERVER_URL}/admin`;
const GET_USER_URL = `${SERVER_URL}/admin/user`;
const GET_ALL_USERS_URL = `${SERVER_URL}/admin/users`;
const DELETE_USER_URL = `${SERVER_URL}/admin/users/delete`;
const PURCHASE_COURSE_URL = `${SERVER_URL}/admin/purchase-course`;
const REFUND_COURSE_URL = `${SERVER_URL}/admin/refund-course`;

class Log {
  constructor(action) {
    this.action = action;
  }
  start(action) {
    console.log(`- [Admin Script]: Action ${this.action} started.`);
  }
  finish(result) {
    console.log(
      `- [Admin Script]: Action ${this.action} completed.${
        result ? " Result:" : ""
      }`,
    );
    if (result) {
      console.log(result);
    }
  }
  fail(error) {
    console.log(`- [Admin Script]: Action ${this.action} failed, error:`);
    console.log(error);
  }
}

const log = new Log(SCRIPT_ACTION);

/**
 * Parse the course progress.
 */
const formatChallengeProgress = progressHistory => {
  return progressHistory.map(p => ({ ...p, progress: JSON.parse(p.progress) }));
};

/**
 * Count the total completed challenges for a user.
 */
const countCompletedChallenges = progress => {
  return progress.reduce(
    (summary, courseProgress) => {
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
const removeExcessUserFields = user => {
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
const filterUsOut = user => {
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

/**
 * Parse course progress, summarize the progress for each user, and sort
 * the results.
 */
const summarizeUserProgress = users => {
  const withProgressSummaries = users.filter(filterUsOut).map(user => {
    // Format the progress history
    const formattedProgress = formatChallengeProgress(
      user.challengeProgressHistory,
    );

    // Get all completed challenges count
    const completedChallenges = countCompletedChallenges(formattedProgress);

    // Get completed challenges
    const completedChallengeList = formattedProgress.reduce(
      (result, courseProgress) =>
        result.concat(Object.values(courseProgress.progress)),
      [],
    );

    // Get only the completed challenge ids
    const completedChallengeIds = formattedProgress.reduce(
      (result, courseProgress) =>
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

/** ===========================================================================
 * Admin API Utils
 * ============================================================================
 */

// Test admin API /admin route
const testAdminIndexRoute = async () => {
  try {
    log.start();
    const result = await axios.get(ADMIN_INDEX_URL, RequestHeaders);
    log.finish(result.data);
  } catch (err) {
    log.fail(err);
  }
};

// Get all users
const getAllUsers = async () => {
  try {
    log.start();
    const result = await axios.get(GET_ALL_USERS_URL, RequestHeaders);
    const filename = "pairwise-users.json";
    const data = summarizeUserProgress(result.data);
    log.finish(
      `Retrieved ${data.users.length} user records. Writing result to file: ${filename}`,
    );
    const users = JSON.stringify(data, null, 2);
    fs.writeFileSync(filename, users, "utf-8");
    console.log("Done!");
  } catch (err) {
    log.fail(err);
  }
};

// Get a single user by email
const getUserByEmail = async email => {
  try {
    if (!email) {
      throw new Error(
        "Must provide USER_EMAIL environment variables to fetch a user!",
      );
    }
    log.start();
    const result = await axios.get(`${GET_USER_URL}/${email}`, RequestHeaders);
    const filename = "pairwise-user-detail.json";
    log.finish(
      `Fetch user with email ${email} successfully. Writing results to file: ${filename}`,
    );
    const user = JSON.stringify(result.data, null, 2);
    fs.writeFileSync(filename, user, "utf-8");
    console.log("Done!");
  } catch (err) {
    log.fail(err);
  }
};

// Fully delete a user account by email
const deleteUserByEmail = async userEmail => {
  try {
    if (!userEmail) {
      throw new Error(
        "Must provide USER_EMAIL environment variables to delete a user by email!",
      );
    }

    log.start();
    const body = { userEmail };
    const result = await axios.post(DELETE_USER_URL, body, RequestHeaders);
    log.finish(result.data);
  } catch (err) {
    log.fail(err);
  }
};

// Fully delete a user account by uuid
const deleteUserByUuid = async uuid => {
  try {
    if (!uuid) {
      throw new Error(
        "Must provide USER_UUID environment variables to delete a user by uuid!",
      );
    }

    log.start();
    const body = { uuid };
    const result = await axios.post(DELETE_USER_URL, body, RequestHeaders);
    log.finish(result.data);
  } catch (err) {
    log.fail(err);
  }
};

// Purchase a course for a user by an admin
const purchaseCourseForUserByAdmin = async (userEmail, courseId) => {
  try {
    if (!USER_EMAIL || !COURSE_ID) {
      throw new Error(
        "Must provide USER_EMAIL and COURSE_ID environment variables to purchase a course for a user!",
      );
    }

    log.start();
    const body = { userEmail, courseId };
    const result = await axios.post(PURCHASE_COURSE_URL, body, RequestHeaders);
    log.finish(result.data);
  } catch (err) {
    log.fail(err);
  }
};

// Refund a course for a user by an admin
const refundCourseForUserByAdmin = async (userEmail, courseId) => {
  try {
    if (!USER_EMAIL || !COURSE_ID) {
      throw new Error(
        "Must provide USER_EMAIL and COURSE_ID environment variables to refund a course for a user!",
      );
    }

    log.start();
    const body = { userEmail, courseId };
    const result = await axios.post(REFUND_COURSE_URL, body, RequestHeaders);
    log.finish(result.data);
  } catch (err) {
    log.fail(err);
  }
};

/** ===========================================================================
 * Run the script based on the provided action
 * ============================================================================
 */

const runScript = () => {
  switch (SCRIPT_ACTION) {
    case TEST:
      return testAdminIndexRoute();
    case GET_USER:
      return getUserByEmail(USER_EMAIL);
    case GET_USERS:
      return getAllUsers();
    case DELETE_USER_BY_EMAIL:
      return deleteUserByEmail(USER_EMAIL);
    case DELETE_USER_BY_UUID:
      return deleteUserByUuid(USER_UUID);
    case PURCHASE:
      return purchaseCourseForUserByAdmin(USER_EMAIL, COURSE_ID);
    case REFUND:
      return refundCourseForUserByAdmin(USER_EMAIL, COURSE_ID);
  }
};

// Run it!
runScript();
