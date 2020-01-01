import axios from "axios";
import request from "supertest";
import { fetchAccessToken, HOST } from "./utils/e2e-utils";

/** ===========================================================================
 * e2e Tests for /user APIs
 * ============================================================================
 */

describe("Payments APIs", () => {
  let accessToken;
  let authorizationHeader;

  beforeAll(async () => {
    accessToken = await fetchAccessToken();
    authorizationHeader = `Bearer ${accessToken}`;
  });

  test("/payments (POST) should require authentication", async done => {
    request(`${HOST}/payments/xyz`)
      .post("/")
      .set("Authorization", "Bearer asd97f8809as7fsa")
      .expect(401)
      .end((error, response) => {
        expect(response.body.error).toBe("Unauthorized");
        done(error);
      });
  });

  test("/payments (POST) rejects invalid courseIds", async done => {
    request(`${HOST}/payments/xyz`)
      .post("/")
      .set("Authorization", authorizationHeader)
      .expect(400)
      .end((error, response) => {
        expect(response.body.message).toBe("The courseId is invalid");
        done(error);
      });
  });

  test("/payments (POST) accepts valid requests", async done => {
    /**
     * [1] Initial payments is empty.
     */
    await request(`${HOST}/user/profile`)
      .get("/")
      .set("Authorization", authorizationHeader)
      .expect(200)
      .expect(response => {
        const { payments } = response.body;
        expect(payments).toEqual([]);
      });

    /**
     * [2] A course can be paid for.
     */
    await request(`${HOST}/payments/fpvPtfu7s`)
      .post("/")
      .set("Authorization", authorizationHeader)
      .expect(201)
      .expect(response => {
        expect(response.text).toBe("Success!");
      });

    /**
     * [3] Repeated payments for the same course fail.
     */
    await request(`${HOST}/payments/fpvPtfu7s`)
      .post("/")
      .set("Authorization", authorizationHeader)
      .expect(400)
      .expect(response => {
        expect(response.body.message).toBe(
          "User has previously paid for this course",
        );
      });

    /**
     * [4] The user now returns the payments information.
     */
    await request(`${HOST}/user/profile`)
      .get("/")
      .set("Authorization", authorizationHeader)
      .expect(200)
      .expect(response => {
        const { payments } = response.body;
        const payment = payments.pop();
        expect(payment.uuid).toBeDefined();
        expect(payment.datePaid).toBeDefined();
        expect(payment.courseId).toBe("fpvPtfu7s");
      });

    done();
  });
});
