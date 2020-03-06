const axios = require("axios");

/**
 * Admin API scripting lifestyles!
 *
 * This needs to be fully removed once a proper admin UI exists. This is
 * a temporary measure to allow us to conduct admin API actions using a
 * hard-coded access token in the production server.
 */

const SERVER_URL = process.env.SERVER_URL || "http://localhost:9000";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "local_admin_token";

// Test admin API /admin route
const testAdminIndexRoute = async () => {
  try {
    console.log("Sending admin request:");
    const result = await axios.get(`${SERVER_URL}/admin`, {
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

testAdminIndexRoute();
