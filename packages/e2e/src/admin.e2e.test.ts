import request from "supertest";
import {
  HOST,
  fetchAccessToken,
  fetchAdminAccessToken,
  createAuthenticatedUser,
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
    const adminAccessToken = await fetchAdminAccessToken();
    return request(`${HOST}/admin`)
      .get("/")
      .set("Authorization", `Bearer ${adminAccessToken}`)
      .expect(200)
      .expect("Admin Service");
  });

  test("/users/admin (GET) get all users", async () => {
    const adminAccessToken = await fetchAdminAccessToken();
    return request(`${HOST}/user/admin`)
      .get("/")
      .set("Authorization", `Bearer ${adminAccessToken}`)
      .expect(200)
      .expect(response => {
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length >= 1).toBe(true);
      });
  });

  // TODO: This test could be improved by verifying the cascade occurs
  // correctly when the user is deleted, i.e. no data related to this
  // user exists in other tables.
  test("/users/admin/delete (DELETE) delete a user", async () => {
    const adminAccessToken = await fetchAdminAccessToken();

    // 1. Create a regular user
    const { user } = await createAuthenticatedUser("facebook");
    const userUuid = user.profile.uuid;

    // 2. Get all users and check the user exists
    await request(`${HOST}/user/admin`)
      .get("/")
      .set("Authorization", `Bearer ${adminAccessToken}`)
      .expect(200)
      .expect(response => {
        const userExists = response.body.find(u => u.uuid === userUuid);
        expect(userExists).toBeDefined();
        expect(userExists.uuid).toBe(userUuid);
      });

    // 3. Delete the user
    await request(`${HOST}/user/admin/delete`)
      .post("/")
      .send({ userUuid })
      .set("Authorization", `Bearer ${adminAccessToken}`)
      .expect(201)
      .expect(response => {
        expect(response.text).toBe("Success");
      });

    // 4. Verify the user no longer exists
    return request(`${HOST}/user/admin`)
      .get("/")
      .set("Authorization", `Bearer ${adminAccessToken}`)
      .expect(200)
      .expect(response => {
        const userExists = response.body.find(u => u.uuid === userUuid);
        expect(userExists).toBe(undefined);
      });
  });
});
