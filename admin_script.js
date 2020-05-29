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
const SCRIPT_ACTION = process.env.SCRIPT_ACTION;

console.log(`\n- Running admin script! Received environment config:\n`);
console.log(`- SCRIPT_ACTION: ${SCRIPT_ACTION}`);
console.log(`- COURSE_ID: ${COURSE_ID}`);
console.log(`- USER_EMAIL: ${USER_EMAIL}`);
console.log(`- SERVER_URL: ${SERVER_URL}`);
console.log(`- ADMIN_TOKEN: ${ADMIN_TOKEN.slice(0, 25)}...`);
console.log(`\nRunning script!\n`);

// Valid script actions:
const TEST = "TEST";
const PURCHASE = "PURCHASE";
const REFUND = "REFUND";
const GET_USERS = "GET_USERS";
const DELETE_USER = "DELETE_USER";
const VALID_ACTIONS = new Set([TEST, PURCHASE, REFUND, GET_USERS, DELETE_USER]);

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
const GET_ALL_USERS_URL = `${SERVER_URL}/user/admin`;
const DELETE_USER_URL = `${SERVER_URL}/user/admin/delete`;
const PURCHASE_COURSE_URL = `${SERVER_URL}/payments/admin/purchase-course`;
const REFUND_COURSE_URL = `${SERVER_URL}/payments/admin/refund-course`;

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
    lastActiveChallengeId: user.lastActiveChallengeId,
    settings: user.settings,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

/**
 * Parse course progress, summarize the progress for each user, and sort
 * the results.
 */
const summarizeUserProgress = users => {
  const withProgressSummaries = users.map(user => {
    // Format the progress histroy
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

  // Record some metrics numbers
  let totalChallengesCompleted = 0;
  let challengesCompletedInLastWeek = 0;
  let newUsersInLastWeek = 0;

  for (const user of withProgressSummaries) {
    const { completedChallengeList } = user;
    const now = Date.now();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const lastWeek = now - oneWeek;

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

  // Create summary with total user count
  const summary = {
    totalUsers: sortedByCompletedChallenges.length,
    newUsersInLastWeek,
    totalChallengesCompleted,
    challengesCompletedInLastWeek,
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
    log.finish(
      `Retrieved ${result.data.length} user records. Writing result to file: ${filename}`,
    );
    const data = summarizeUserProgress(result.data);
    const users = JSON.stringify(data, null, 2);
    fs.writeFileSync(filename, users, "utf-8");
    console.log("Done!");
  } catch (err) {
    log.fail(err);
  }
};

// Fully delete a user account
const deleteUserByEmail = async userEmail => {
  try {
    if (!USER_EMAIL) {
      throw new Error(
        "Must provide USER_EMAIL environment variables to delete a user!",
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
    case GET_USERS:
      return getAllUsers();
    case DELETE_USER:
      return deleteUserByEmail(USER_EMAIL);
    case PURCHASE:
      return purchaseCourseForUserByAdmin(USER_EMAIL, COURSE_ID);
    case REFUND:
      return refundCourseForUserByAdmin(USER_EMAIL, COURSE_ID);
  }
};

// Run it!
runScript();
