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

  test("/payments (POST) accepts valid requests", () => {
    return request(`${HOST}/payments/fpvPtfu7s`)
      .post("/")
      .set("Authorization", authorizationHeader)
      .expect(201)
      .expect(response => {
        expect(response.text).toBe("Success!");
      });
  });
});
