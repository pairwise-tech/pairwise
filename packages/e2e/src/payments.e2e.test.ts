import request from "supertest";
import { AdminPurchaseCourseDto } from "@pairwise/common";
import {
  fetchAccessToken,
  fetchAdminAccessToken,
  fetchUserWithAccessToken,
} from "./utils/e2e-utils";
import ENV from "./utils/e2e-env";

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

  test.todo(
    "Purchase 1+ courses and verify course purchase logic works correctly",
  );

  test("/payments/checkout (POST) should require authentication", async (done) => {
    request(`${ENV.HOST}/payments/checkout`)
      .post("/")
      .send({
        courseId: "fpvPtfu7s",
        plan: "REGULAR",
      })
      .set("Authorization", "Bearer asd97f8809as7fsa")
      .expect(401)
      .end((error, response) => {
        expect(response.body.message).toBe("Unauthorized");
        done(error);
      });
  });

  test("/payments/checkout (POST) rejects invalid course ids", async (done) => {
    request(`${ENV.HOST}/payments/checkout`)
      .post("/")
      .send({
        courseId: "zsdfasfsafsa",
        plan: "REGULAR",
      })
      .set("Authorization", authorizationHeader)
      .expect(400)
      .end((error, response) => {
        expect(response.body.message).toBe("The courseId is invalid.");
        done(error);
      });
  });

  test("/payments/checkout (POST) rejects invalid payment plan values", async (done) => {
    request(`${ENV.HOST}/payments/checkout`)
      .post("/")
      .send({
        courseId: "fpvPtfu7s",
        plan: "BONUS",
      })
      .set("Authorization", authorizationHeader)
      .expect(400)
      .end((error, response) => {
        expect(response.body.message).toBe(
          "Invalid payment plan provided, received: BONUS",
        );
        done(error);
      });
  });

  test("/payments/checkout (POST) rejects requests which lack a payment plan", async (done) => {
    request(`${ENV.HOST}/payments/checkout`)
      .post("/")
      .send({
        courseId: "fpvPtfu7s",
      })
      .set("Authorization", authorizationHeader)
      .expect(400)
      .end((error, response) => {
        expect(response.body.message).toBe(
          "Invalid payment plan provided, received: undefined",
        );
        done(error);
      });
  });

  // Note: Will fail with Expired API Key provided: sk_test_mb****************************vNDQ
  test.skip("/payments/checkout (POST) accepts a request with a valid course id", () => {
    return request(`${ENV.HOST}/payments/checkout`)
      .post("/")
      .send({
        courseId: "fpvPtfu7s",
        plan: "REGULAR",
      })
      .set("Authorization", authorizationHeader)
      .expect(201)
      .expect((response) => {
        const { body } = response;
        expect(body.stripeCheckoutSessionId).toBeDefined();
        expect(typeof body.stripeCheckoutSessionId).toBe("string");
      });
  });

  // Note: Will fail with Expired API Key provided: sk_test_mb****************************vNDQ
  test.skip("/payments/checkout (POST) accepts a request with a PREMIUM payment plan", () => {
    return request(`${ENV.HOST}/payments/checkout`)
      .post("/")
      .send({
        courseId: "fpvPtfu7s",
        plan: "PREMIUM",
      })
      .set("Authorization", authorizationHeader)
      .expect(201)
      .expect((response) => {
        const { body } = response;
        expect(body.stripeCheckoutSessionId).toBeDefined();
        expect(typeof body.stripeCheckoutSessionId).toBe("string");
      });
  });

  test("/admin/purchase-course (POST) requires admin authentication", async (done) => {
    const body: AdminPurchaseCourseDto = {
      courseId: "asdfafaasdfsa",
      userEmail: user.profile.email,
      plan: "REGULAR",
    };

    request(`${ENV.HOST}/admin/purchase-course`)
      .post("/")
      .send(body)
      .set("Authorization", authorizationHeader)
      .expect(401)
      .end((error, response) => {
        expect(response.body.error).toBe("Unauthorized");
        done(error);
      });
  });

  test("/admin/purchase-course (POST) requires a valid course id", async (done) => {
    const body: AdminPurchaseCourseDto = {
      courseId: "asdfafaasdfsa",
      userEmail: user.profile.email,
      plan: "REGULAR",
    };

    request(`${ENV.HOST}/admin/purchase-course`)
      .post("/")
      .send(body)
      .set("Authorization", adminAuthorizationHeader)
      .expect(400)
      .end((error, response) => {
        expect(response.body.message).toBe("The courseId is invalid.");
        done(error);
      });
  });

  test("/admin/purchase-course (POST) requires the email of an existing user", async (done) => {
    const body: AdminPurchaseCourseDto = {
      courseId: "fpvPtfu7s",
      userEmail: "sean@pairwise.tech",
      plan: "REGULAR",
    };

    request(`${ENV.HOST}/admin/purchase-course`)
      .post("/")
      .send(body)
      .set("Authorization", adminAuthorizationHeader)
      .expect(400)
      .end((error, response) => {
        expect(response.body.message).toBe("No user could be found.");
        done(error);
      });
  });

  test("/admin/purchase-course (POST) accepts requests from an admin for a valid user and course", async () => {
    const body: AdminPurchaseCourseDto = {
      courseId: "fpvPtfu7s",
      userEmail: user.profile.email,
      plan: "REGULAR",
    };

    await request(`${ENV.HOST}/admin/purchase-course`)
      .post("/")
      .send(body)
      .set("Authorization", adminAuthorizationHeader)
      .expect(201)
      .expect((response) => {
        expect(response.text).toBe("Success");
      });

    const userWithCourse = await fetchUserWithAccessToken(accessToken);
    const { payments } = userWithCourse;
    const course = payments.find((p) => p.courseId === "fpvPtfu7s");
    expect(course).toBeDefined();
  });

  test("/admin/purchase-course (POST) rejects requests if a user has already purchased the course", async (done) => {
    // Get a new user:
    accessToken = await fetchAccessToken();
    authorizationHeader = `Bearer ${accessToken}`;
    user = await fetchUserWithAccessToken(accessToken);

    const body: AdminPurchaseCourseDto = {
      courseId: "fpvPtfu7s",
      userEmail: user.profile.email,
      plan: "REGULAR",
    };

    // Purchase the course
    await request(`${ENV.HOST}/admin/purchase-course`)
      .post("/")
      .send(body)
      .set("Authorization", adminAuthorizationHeader)
      .expect(201)
      .expect((response) => {
        expect(response.text).toBe("Success");
      });

    // Try to purchase it again and expect a failure
    await request(`${ENV.HOST}/admin/purchase-course`)
      .post("/")
      .send(body)
      .set("Authorization", adminAuthorizationHeader)
      .expect(400)
      .expect((error) => {
        expect(error.body.message).toBe(
          "User has already paid for this course",
        );
      });

    done();
  });

  test("/admin/refund-course (POST) allows courses to be refunded", async (done) => {
    // Get a new user:
    accessToken = await fetchAccessToken();
    authorizationHeader = `Bearer ${accessToken}`;
    user = await fetchUserWithAccessToken(accessToken);

    const body: AdminPurchaseCourseDto = {
      courseId: "fpvPtfu7s",
      userEmail: user.profile.email,
      plan: "REGULAR",
    };

    // Purchase the course
    await request(`${ENV.HOST}/admin/purchase-course`)
      .post("/")
      .send(body)
      .set("Authorization", adminAuthorizationHeader)
      .expect(201)
      .expect((response) => {
        expect(response.text).toBe("Success");
      });

    const userWithCourse = await fetchUserWithAccessToken(accessToken);
    const { payments } = userWithCourse;
    const course = payments.find((p) => p.courseId === "fpvPtfu7s");
    expect(course.status).toBe("CONFIRMED");

    // Refund the course
    await request(`${ENV.HOST}/admin/refund-course`)
      .post("/")
      .send(body)
      .set("Authorization", adminAuthorizationHeader)
      .expect(201)
      .expect((response) => {
        expect(response.text).toBe("Success");
      });

    const userWithCourseRefunded = await fetchUserWithAccessToken(accessToken);
    const refundedCourse = userWithCourseRefunded.payments.find(
      (p) => p.courseId === "fpvPtfu7s",
    );
    expect(refundedCourse.status).toBe("REFUNDED");

    done();
  });

  test("/admin/refund-course (POST) invalid refund requests are rejected", async (done) => {
    // Get a new user:
    accessToken = await fetchAccessToken();
    authorizationHeader = `Bearer ${accessToken}`;
    user = await fetchUserWithAccessToken(accessToken);

    let body: AdminPurchaseCourseDto = {
      courseId: "fpvPtfu7s",
      userEmail: user.profile.email,
      plan: "REGULAR",
    };

    // Refund is not possible yet because no purchase exists
    await request(`${ENV.HOST}/admin/refund-course`)
      .post("/")
      .send(body)
      .set("Authorization", adminAuthorizationHeader)
      .expect(400)
      .expect((error) => {
        expect(error.body.message).toBe(
          "The user has not purchased this course",
        );
      });

    // Purchase the course
    await request(`${ENV.HOST}/admin/purchase-course`)
      .post("/")
      .send(body)
      .set("Authorization", adminAuthorizationHeader)
      .expect(201)
      .expect((response) => {
        expect(response.text).toBe("Success");
      });

    body = {
      courseId: "sadfasf07sa",
      userEmail: user.profile.email,
      plan: "REGULAR",
    };

    // Refund requires a valid course id
    await request(`${ENV.HOST}/admin/refund-course`)
      .post("/")
      .send(body)
      .set("Authorization", adminAuthorizationHeader)
      .expect(400)
      .expect((error) => {
        expect(error.body.message).toBe("The courseId is invalid.");
      });

    body = {
      courseId: "fpvPtfu7s",
      userEmail: "sean@pairwise.tech",
      plan: "REGULAR",
    };

    // Refund requires a valid user
    await request(`${ENV.HOST}/admin/refund-course`)
      .post("/")
      .send(body)
      .set("Authorization", adminAuthorizationHeader)
      .expect(400)
      .expect((error) => {
        expect(error.body.message).toBe("No user could be found.");
      });

    body = {
      courseId: "fpvPtfu7s",
      userEmail: user.profile.email,
      plan: "REGULAR",
    };

    // Refund the course
    await request(`${ENV.HOST}/admin/refund-course`)
      .post("/")
      .send(body)
      .set("Authorization", adminAuthorizationHeader)
      .expect(201)
      .expect((response) => {
        expect(response.text).toBe("Success");
      });

    // Refund requires the course is not already refunded
    await request(`${ENV.HOST}/admin/refund-course`)
      .post("/")
      .send(body)
      .set("Authorization", adminAuthorizationHeader)
      .expect(400)
      .expect((error) => {
        expect(error.body.message).toBe("The course is already refunded");
      });

    done();
  });
});
