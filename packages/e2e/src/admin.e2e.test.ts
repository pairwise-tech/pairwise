import request from "supertest";
import {
  HOST,
  fetchAccessToken,
  fetchAdminAccessToken,
} from "./utils/e2e-utils";

/** ===========================================================================
 * e2e tests for Admin apis
 * ============================================================================
 */

describe("Admin (e2e)", () => {
  test("/admin (GET) index route returns 401 for unauthenticated users", () => {
    return request(`${HOST}/admin`)
      .get("/")
      .expect(401);
  });

  test("/admin (GET) index route returns 401 for normal users", async () => {
    const accessToken = await fetchAccessToken();
    return request(`${HOST}/admin`)
      .get("/")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(401);
  });

  test("/admin (GET) index route returns 200 for admin users", async () => {
    const accessToken = await fetchAdminAccessToken();
    return request(`${HOST}/admin`)
      .get("/")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200)
      .expect("Admin Service");
  });
});
