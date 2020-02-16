import request from "supertest";
import {
  fetchAccessToken,
  HOST,
  fetchAdminAccessToken,
  fetchUserWithAccessToken,
} from "./utils/e2e-utils";

/** ===========================================================================
 * e2e Tests for /user APIs
 * ============================================================================
 */

describe("Payments APIs", () => {
  let user;
  let accessToken;
  let authorizationHeader;

  let adminAccessToken;
  let adminAuthorizationHeader;

  beforeAll(async () => {
    // Get regular user access token
    accessToken = await fetchAccessToken();
    authorizationHeader = `Bearer ${accessToken}`;

    // Get admin user access token
    adminAccessToken = await fetchAdminAccessToken();
    adminAuthorizationHeader = `Bearer ${adminAccessToken}`;

    user = await fetchUserWithAccessToken(accessToken);
  });

  test("/checkout (POST) should require authentication", async done => {
    request(`${HOST}/checkout/fpvPtfu7s`)
      .post("/")
      .set("Authorization", "Bearer asd97f8809as7fsa")
      .expect(401)
      .end((error, response) => {
        expect(response.body.error).toBe("Unauthorized");
        done(error);
      });
  });

  test("/checkout (POST) rejects invalid course ids", async done => {
    request(`${HOST}/checkout/zsdfasfsafsa`)
      .post("/")
      .set("Authorization", "Bearer asd97f8809as7fsa")
      .expect(400)
      .end((error, response) => {
        expect(response.body.message).toBe("The courseId is invalid");
        done(error);
      });
  });

  test("/checkout (POST) accepts a request with a valid course id", async done => {
    request(`${HOST}/checkout/zsdfasfsafsa`)
      .post("/")
      .set("Authorization", authorizationHeader)
      .expect(200)
      .expect(response => {
        const { body } = response;
        expect(body.stripeCheckoutSessionId).toBeDefined();
        expect(typeof body.stripeCheckoutSessionId).toBe("string");
      });
  });

  test("/admin-purchase-course (POST) requires admin authentication", async done => {
    request(`${HOST}/admin-purchase-course`)
      .post("/")
      .send({
        courseId: "asdfafaasdfsa",
        userEmail: user.profile.email,
      })
      .set("Authorization", authorizationHeader)
      .expect(401)
      .end((error, response) => {
        expect(response.body.error).toBe("Unauthorized");
        done(error);
      });
  });

  test("/admin-purchase-course (POST) requires a valid course id", async done => {
    request(`${HOST}/admin-purchase-course`)
      .post("/")
      .send({
        courseId: "asdfafaasdfsa",
        userEmail: user.profile.email,
      })
      .set("Authorization", adminAuthorizationHeader)
      .expect(400)
      .end((error, response) => {
        expect(response.body.message).toBe("The courseId is invalid");
        done(error);
      });
  });

  test("/admin-purchase-course (POST) requires the email of an existing user", async done => {
    request(`${HOST}/admin-purchase-course`)
      .post("/")
      .send({
        courseId: "fpvPtfu7s",
        userEmail: "sean@pairwise.tech",
      })
      .set("Authorization", adminAuthorizationHeader)
      .expect(400)
      .end((error, response) => {
        expect(response.body.message).toBe("No user could be found");
        done(error);
      });
  });

  test("/admin-purchase-course (POST) accepts requests from an admin for a valid user and course", async done => {
    await request(`${HOST}/admin-purchase-course`)
      .post("/")
      .send({
        courseId: "fpvPtfu7s",
        userEmail: user.profile.email,
      })
      .set("Authorization", adminAuthorizationHeader)
      .expect(201)
      .expect(response => {
        expect(response.text).toBe("Success");
      });

    const userWithCourse = await fetchUserWithAccessToken(accessToken);
    const { payments } = userWithCourse;
    const course = payments.find(p => p.courseId === "fpvPtfu7s");
    expect(course).toBeDefined();
  });

  test("/admin-purchase-course (POST) rejects requests if a user has already purchased the course", async done => {
    // Purchase the course
    await request(`${HOST}/admin-purchase-course`)
      .post("/")
      .send({
        courseId: "fpvPtfu7s",
        userEmail: user.profile.email,
      })
      .set("Authorization", adminAuthorizationHeader)
      .expect(201)
      .expect(response => {
        expect(response.text).toBe("Success");
      });

    // Try to purhcase it again and expect a failure
    await request(`${HOST}/admin-purchase-course`)
      .post("/")
      .send({
        courseId: "fpvPtfu7s",
        userEmail: user.profile.email,
      })
      .set("Authorization", adminAuthorizationHeader)
      .expect(400)
      .end((error, response) => {
        expect(response.body.message).toBe(
          "User has already paid for this course",
        );
      });

    done();
  });
});
