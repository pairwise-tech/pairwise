const axios = require("axios");

/** ===========================================================================
 * Admin API scripting lifestyles!
 * ----------------------------------------------------------------------------
 * This needs to be fully removed once a proper admin UI exists. This is
 * a temporary measure to allow us to conduct admin API actions using a
 * hard-coded access token in the production server.
 * ============================================================================
 */

// Read environment variables
const SERVER_URL = process.env.SERVER_URL || "http://localhost:9000";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "local_admin_token";
const COURSE_ID = process.env.COURSE_ID;
const USER_EMAIL = process.env.USER_EMAIL;

// Admin API urls
const ADMIN_INDEX_URL = `${SERVER_URL}/admin`;
const PURCHASE_COURSE_URL = `${SERVER_URL}/admin-purchase-course`;

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

// Purchase a course for a user by an admin
const purchaseCourseForUserByAdmin = async () => {
  try {
    if (!USER_EMAIL && !COURSE_ID) {
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
        userEmail: USER_EMAIL,
        courseId: COURSE_ID,
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

/** ===========================================================================
 * Uncomment an API method to run it in the script! Be careful!
 * ============================================================================
 */

// testAdminIndexRoute();
// purchaseCourseForUserByAdmin();
