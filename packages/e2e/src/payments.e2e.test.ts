import request from "supertest";
import {
  fetchAccessToken,
  HOST,
  fetchAdminAccessToken,
  fetchUserWithAccessToken,
} from "./utils/e2e-utils";

/** ===========================================================================
 * e2e Tests for /payments APIs
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

    // Fetch the user
    user = await fetchUserWithAccessToken(accessToken);

    // Get admin user access token
    adminAccessToken = await fetchAdminAccessToken();
    adminAuthorizationHeader = `Bearer ${adminAccessToken}`;
  });

  test("/payments/checkout (POST) should require authentication", async done => {
    request(`${HOST}/payments/checkout/fpvPtfu7s`)
      .post("/")
      .set("Authorization", "Bearer asd97f8809as7fsa")
      .expect(401)
      .end((error, response) => {
        expect(response.body.message).toBe("Unauthorized");
        done(error);
      });
  });

  test("/payments/checkout (POST) rejects invalid course ids", async done => {
    request(`${HOST}/payments/checkout/zsdfasfsafsa`)
      .post("/")
      .set("Authorization", authorizationHeader)
      .expect(400)
      .end((error, response) => {
        expect(response.body.message).toBe("The courseId is invalid.");
        done(error);
      });
  });

  test("/payments/checkout (POST) accepts a request with a valid course id", () => {
    return request(`${HOST}/payments/checkout/fpvPtfu7s`)
      .post("/")
      .set("Authorization", authorizationHeader)
      .expect(201)
      .expect(response => {
        const { body } = response;
        expect(body.stripeCheckoutSessionId).toBeDefined();
        expect(typeof body.stripeCheckoutSessionId).toBe("string");
      });
  });

  test("/payments/admin/purchase-course (POST) requires admin authentication", async done => {
    request(`${HOST}/payments/admin/purchase-course`)
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

  test("/payments/admin/purchase-course (POST) requires a valid course id", async done => {
    request(`${HOST}/payments/admin/purchase-course`)
      .post("/")
      .send({
        courseId: "asdfafaasdfsa",
        userEmail: user.profile.email,
      })
      .set("Authorization", adminAuthorizationHeader)
      .expect(400)
      .end((error, response) => {
        expect(response.body.message).toBe("The courseId is invalid.");
        done(error);
      });
  });

  test("/payments/admin/purchase-course (POST) requires the email of an existing user", async done => {
    request(`${HOST}/payments/admin/purchase-course`)
      .post("/")
      .send({
        courseId: "fpvPtfu7s",
        userEmail: "sean@pairwise.tech",
      })
      .set("Authorization", adminAuthorizationHeader)
      .expect(400)
      .end((error, response) => {
        expect(response.body.message).toBe("No user could be found.");
        done(error);
      });
  });

  test("/payments/admin/purchase-course (POST) accepts requests from an admin for a valid user and course", async () => {
    await request(`${HOST}/payments/admin/purchase-course`)
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

  test("/payments/admin/purchase-course (POST) rejects requests if a user has already purchased the course", async done => {
    // Get a new user:
    accessToken = await fetchAccessToken();
    authorizationHeader = `Bearer ${accessToken}`;
    user = await fetchUserWithAccessToken(accessToken);

    const body = {
      courseId: "fpvPtfu7s",
      userEmail: user.profile.email,
    };

    // Purchase the course
    await request(`${HOST}/payments/admin/purchase-course`)
      .post("/")
      .send(body)
      .set("Authorization", adminAuthorizationHeader)
      .expect(201)
      .expect(response => {
        expect(response.text).toBe("Success");
      });

    // Try to purchase it again and expect a failure
    await request(`${HOST}/payments/admin/purchase-course`)
      .post("/")
      .send(body)
      .set("Authorization", adminAuthorizationHeader)
      .expect(400)
      .expect((error, response) => {
        expect(error.body.message).toBe(
          "User has already paid for this course",
        );
      });

    done();
  });

  test("/payments/admin/refund-course (POST) allows courses to be refunded", async done => {
    // Get a new user:
    accessToken = await fetchAccessToken();
    authorizationHeader = `Bearer ${accessToken}`;
    user = await fetchUserWithAccessToken(accessToken);

    const body = {
      courseId: "fpvPtfu7s",
      userEmail: user.profile.email,
    };

    // Purchase the course
    await request(`${HOST}/payments/admin/purchase-course`)
      .post("/")
      .send(body)
      .set("Authorization", adminAuthorizationHeader)
      .expect(201)
      .expect(response => {
        expect(response.text).toBe("Success");
      });

    const userWithCourse = await fetchUserWithAccessToken(accessToken);
    const { payments } = userWithCourse;
    const course = payments.find(p => p.courseId === "fpvPtfu7s");
    expect(course.status).toBe("CONFIRMED");

    // Refund the course
    await request(`${HOST}/payments/admin/refund-course`)
      .post("/")
      .send(body)
      .set("Authorization", adminAuthorizationHeader)
      .expect(201)
      .expect(response => {
        expect(response.text).toBe("Success");
      });

    const userWithCourseRefunded = await fetchUserWithAccessToken(accessToken);
    const refundedCourse = userWithCourseRefunded.payments.find(
      p => p.courseId === "fpvPtfu7s",
    );
    expect(refundedCourse.status).toBe("REFUNDED");

    done();
  });

  test("/payments/admin/refund-course (POST) invalid refund requests are rejected", async done => {
    // Get a new user:
    accessToken = await fetchAccessToken();
    authorizationHeader = `Bearer ${accessToken}`;
    user = await fetchUserWithAccessToken(accessToken);

    const body = {
      courseId: "fpvPtfu7s",
      userEmail: user.profile.email,
    };

    // Refund is not possible yet because no purchase exists
    await request(`${HOST}/payments/admin/refund-course`)
      .post("/")
      .send(body)
      .set("Authorization", adminAuthorizationHeader)
      .expect(400)
      .expect((error, response) => {
        expect(error.body.message).toBe(
          "The user has not purchased this course",
        );
      });

    // Purchase the course
    await request(`${HOST}/payments/admin/purchase-course`)
      .post("/")
      .send(body)
      .set("Authorization", adminAuthorizationHeader)
      .expect(201)
      .expect(response => {
        expect(response.text).toBe("Success");
      });

    // Refund requires a valid course id
    await request(`${HOST}/payments/admin/refund-course`)
      .post("/")
      .send({
        courseId: "sadfasf07sa",
        userEmail: user.profile.email,
      })
      .set("Authorization", adminAuthorizationHeader)
      .expect(400)
      .expect((error, response) => {
        expect(error.body.message).toBe("The courseId is invalid.");
      });

    // Refund requires a valid user
    await request(`${HOST}/payments/admin/refund-course`)
      .post("/")
      .send({
        courseId: "fpvPtfu7s",
        userEmail: "sean@pairwise.tech",
      })
      .set("Authorization", adminAuthorizationHeader)
      .expect(400)
      .expect((error, response) => {
        expect(error.body.message).toBe("No user could be found.");
      });

    // Refund the course
    await request(`${HOST}/payments/admin/refund-course`)
      .post("/")
      .send(body)
      .set("Authorization", adminAuthorizationHeader)
      .expect(201)
      .expect(response => {
        expect(response.text).toBe("Success");
      });

    // Refund requires the course is not already refunded
    await request(`${HOST}/payments/admin/refund-course`)
      .post("/")
      .send(body)
      .set("Authorization", adminAuthorizationHeader)
      .expect(400)
      .expect((error, response) => {
        expect(error.body.message).toBe("The course is already refunded");
      });

    done();
  });
});
