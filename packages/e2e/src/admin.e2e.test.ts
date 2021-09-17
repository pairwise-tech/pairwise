import request from "supertest";
import ENV from "./utils/e2e-env";
import {
  fetchAccessToken,
  fetchAdminAccessToken,
  createAuthenticatedUser,
} from "./utils/e2e-utils";

/** ===========================================================================
 * e2e tests for Admin apis
 * ============================================================================
 */

describe("Admin (e2e)", () => {
  test.todo(
    "[DELETE] /admin/users endpoint: test user deletion works and deletion cascades to all user related data.",
  );

  test("/admin (GET) index route returns 401 for unauthenticated users", () => {
    return request(`${ENV.HOST}/admin`).get("/").expect(401);
  });

  test("/admin (GET) index route returns 401 for normal users", async () => {
    const accessToken = await fetchAccessToken();
    return request(`${ENV.HOST}/admin`)
      .get("/")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(401);
  });

  test("/admin (GET) index route returns 200 for admin users", async () => {
    const adminAccessToken = await fetchAdminAccessToken();
    return request(`${ENV.HOST}/admin`)
      .get("/")
      .set("Authorization", `Bearer ${adminAccessToken}`)
      .expect(200)
      .expect("Admin Service");
  });

  test("/users/admin (GET) get all users", async () => {
    const adminAccessToken = await fetchAdminAccessToken();
    return request(`${ENV.HOST}/admin/users`)
      .get("/")
      .set("Authorization", `Bearer ${adminAccessToken}`)
      .expect(200)
      .expect((response) => {
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length >= 1).toBe(true);
      });
  });

  test("/users/admin/delete (DELETE) delete a user", async () => {
    const adminAccessToken = await fetchAdminAccessToken();

    // 1. Create a regular user
    const { user } = await createAuthenticatedUser("github");
    const userEmail = user.profile.email;

    // 2. Get all users and check the user exists
    await request(`${ENV.HOST}/admin/users`)
      .get("/")
      .set("Authorization", `Bearer ${adminAccessToken}`)
      .expect(200)
      .expect((response) => {
        const userExists = response.body.find((u) => u.email === userEmail);
        expect(userExists).toBeDefined();
        expect(userExists.email).toBe(userEmail);
      });

    // 3. Delete the user
    await request(`${ENV.HOST}/admin/users/delete`)
      .post("/")
      .send({ userEmail })
      .set("Authorization", `Bearer ${adminAccessToken}`)
      .expect(201)
      .expect((response) => {
        expect(response.text).toBe("Success");
      });

    // 4. Verify the user no longer exists
    return request(`${ENV.HOST}/admin/users`)
      .get("/")
      .set("Authorization", `Bearer ${adminAccessToken}`)
      .expect(200)
      .expect((response) => {
        const userExists = response.body.find((u) => u.email === userEmail);
        expect(userExists).toBe(undefined);
      });
  });
});
