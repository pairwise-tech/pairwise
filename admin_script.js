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
console.log(`- ADMIN_TOKEN: ${ADMIN_TOKEN.slice(0, 15)}...`);
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
const GET_ALL_USERS_URL = `${SERVER_URL}/users/admin`;
const DELETE_USER_URL = `${SERVER_URL}/users/admin`;
const PURCHASE_COURSE_URL = `${SERVER_URL}/payments/admin/purchase-course`;
const REFUND_COURSE_URL = `${SERVER_URL}/payments/admin/refund-course`;

class log {
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

const Log = new log(SCRIPT_ACTION);

/** ===========================================================================
 * Admin API Utils
 * ============================================================================
 */

// Test admin API /admin route
const testAdminIndexRoute = async () => {
  try {
    Log.start();
    const result = await axios.get(ADMIN_INDEX_URL, RequestHeaders);
    Log.finish(result.data);
  } catch (err) {
    Log.fail(err);
  }
};

// Get all users
const getAllUsers = async () => {
  try {
    Log.start();
    const result = await axios.get(GET_ALL_USERS_URL, RequestHeaders);
    Log.finish(
      `Retrieved ${result.data.length} user records. Writing result to file: ${filename}`,
    );
    const filename = "pairwise-users.json";
    const users = JSON.stringify(result.data, null, 2);
    fs.writeFileSync(filename, users, "utf-8");
    console.log("Done!");
  } catch (err) {
    Log.fail(err);
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

    Log.start();
    const body = { userEmail };
    const result = await axios.delete(DELETE_USER_URL, body, RequestHeaders);
    Log.finish(result.data);
  } catch (err) {
    Log.fail(err);
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

    Log.start();
    const body = { userEmail, courseId };
    const result = await axios.post(PURCHASE_COURSE_URL, body, RequestHeaders);
    Log.finish(result.data);
  } catch (err) {
    Log.fail(err);
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

    Log.start();
    const body = { userEmail, courseId };
    const result = await axios.post(REFUND_COURSE_URL, body, RequestHeaders);
    Log.finish(result.data);
  } catch (err) {
    Log.fail(err);
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
      return deleteUserByEmail();
    case PURCHASE:
      return purchaseCourseForUserByAdmin(USER_EMAIL, COURSE_ID);
    case REFUND:
      return refundCourseForUserByAdmin(USER_EMAIL, COURSE_ID);
  }
};

// Run it!
runScript();
