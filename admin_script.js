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
 * SCRIPT_ACTION=REFUND user_email@gmail.com COURSE_ID=fpvPtfu7s node admin_script.js
 * SCRIPT_ACTION=GET_USERS node admin_script.js
 *
 * ============================================================================
 */

// Read environment variables
const SERVER_URL = process.env.SERVER_URL || "http://localhost:9000";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "local_admin_token";
const COURSE_ID = process.env.COURSE_ID;
const USER_EMAIL = process.env.USER_EMAIL;
const SCRIPT_ACTION = process.env.SCRIPT_ACTION;

// Valid script actions:
const TEST = "TEST";
const PURCHASE = "PURCHASE";
const REFUND = "REFUND";
const GET_USERS = "GET_USERS";
const VALID_ACTIONS = new Set([TEST, PURCHASE, REFUND, GET_USERS]);

const validateActionType = actionType => {
  if (VALID_ACTIONS.has(actionType)) {
    console.log(`Running Admin script for action type: ${SCRIPT_ACTION}`);
    return true;
  }

  throw new Error(`Invalid action received! -> ${SCRIPT_ACTION}`);
};

// Validate the requested action
validateActionType(SCRIPT_ACTION);

// Admin API urls
const ADMIN_INDEX_URL = `${SERVER_URL}/admin`;
const GET_ALL_USERS_URL = `${SERVER_URL}/admin/users`;
const PURCHASE_COURSE_URL = `${SERVER_URL}/admin/purchase-course`;
const REFUND_COURSE_URL = `${SERVER_URL}/admin/refund-course`;

/** ===========================================================================
 * Admin API Utils
 * ============================================================================
 */

// Test admin API /admin route
const testAdminIndexRoute = async () => {
  try {
    console.log("Sending admin request:");
    const result = await axios.get(ADMIN_INDEX_URL, {
      headers: {
        admin_access_token: ADMIN_TOKEN,
      },
    });

    console.log("Admin request successful, response:");
    console.log(result.data);
  } catch (err) {
    console.log("Admin request failed, error:");
    console.log(err);
  }
};

// Get all users
const getAllUsers = async () => {
  try {
    console.log(
      `Sending admin request to retrieve all users, id: ${COURSE_ID} for user, email: ${USER_EMAIL}`,
    );
    const result = await axios.get(GET_ALL_USERS_URL, {
      headers: {
        admin_access_token: ADMIN_TOKEN,
      },
    });

    console.log("Admin request successful for retrieving all users, response:");
    console.log(result.data);
    const users = JSON.stringify(result.data, null, 2);
    fs.writeFileSync("pairwise-users.json", users, "utf-8");
  } catch (err) {
    console.log("Admin request failed to retieve all users, error:");
    console.log(err);
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
    console.log(
      `Sending admin request to purchase course, id: ${COURSE_ID} for user, email: ${USER_EMAIL}`,
    );
    const result = await axios.post(
      PURCHASE_COURSE_URL,
      {
        userEmail,
        courseId,
      },
      {
        headers: {
          admin_access_token: ADMIN_TOKEN,
        },
      },
    );

    console.log("Admin request successful to purchase course, response:");
    console.log(result.data);
  } catch (err) {
    console.log("Admin request failed to purchase course, error:");
    console.log(err);
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
    console.log(
      `Sending admin request to refund course, id: ${COURSE_ID} for user, email: ${USER_EMAIL}`,
    );
    const result = await axios.post(
      REFUND_COURSE_URL,
      {
        userEmail,
        courseId,
      },
      {
        headers: {
          admin_access_token: ADMIN_TOKEN,
        },
      },
    );

    console.log("Admin request successful to refund course, response:");
    console.log(result.data);
  } catch (err) {
    console.log("Admin request failed to refund course, error:");
    console.log(err);
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
    case PURCHASE:
      return purchaseCourseForUserByAdmin(USER_EMAIL, COURSE_ID);
    case REFUND:
      return refundCourseForUserByAdmin(USER_EMAIL, COURSE_ID);
  }
};

// Run it!
runScript();
