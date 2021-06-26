import request from "supertest";
import {
  fetchAccessToken,
  HOST,
  fetchAdminAccessToken,
} from "./utils/e2e-utils";

/** ===========================================================================
 * e2e Tests for /progress APIs
 * ============================================================================
 */

describe("User Feedback APIs", () => {
  let accessToken;
  let authorizationHeader;

  beforeAll(async () => {
    accessToken = await fetchAccessToken();
    authorizationHeader = `Bearer ${accessToken}`;
  });

  test("/feedback (POST) requires an authenticated user", async (done) => {
    request(`${HOST}/feedback`)
      .post("/")
      .send({
        feedback: "hi",
        type: "TOO_HARD",
        challengeId: "0fCd6MkU",
      })
      .expect(201)
      .end((error, response) => {
        expect(response.text).toBe("Success");
        done(error);
      });
  });

  test("/feedback (POST) rejects invalid challenge ids", async (done) => {
    request(`${HOST}/feedback`)
      .post("/")
      .send({
        feedback: "hi",
        type: "TOO_HARD",
        challengeId: "9scykDasf8d90as7fd7a0",
      })
      .set("Authorization", authorizationHeader)
      .expect(400)
      .end((error, response) => {
        expect(response.body.message).toBe("The challengeId is invalid.");
        done(error);
      });
  });

  test("/feedback (POST) rejects feedback with an invalid feedback type", async (done) => {
    request(`${HOST}/feedback`)
      .post("/")
      .send({
        feedback: "hi",
        type: "TOO_HARD?",
        challengeId: "9scykDold",
      })
      .set("Authorization", authorizationHeader)
      .expect(400)
      .end((error, response) => {
        expect(response.body.message).toBe("Invalid feedback type used.");
        done(error);
      });
  });

  test("/feedback (POST) inserts feedback entries correctly", async (done) => {
    await request(`${HOST}/feedback`)
      .post("/")
      .send({
        type: "TOO_HARD",
        challengeId: "9scykDold",
        feedback: "This challenge is too hard!",
      })
      .set("Authorization", authorizationHeader)
      .expect(201)
      .expect((response) => {
        expect(response.text).toBe("Success");
      });

    await request(`${HOST}/admin/feedback/9scykDold`)
      .get("/")
      .set("Authorization", authorizationHeader)
      .expect(401)
      .expect((response) => {
        expect(response.body.error).toBe("Unauthorized");
      });

    const adminAccessToken = await fetchAdminAccessToken();
    await request(`${HOST}/admin/feedback/9scykDold`)
      .get("/")
      .send({
        type: "TOO_HARD",
        challengeId: "9scykDold",
        feedback: "This challenge is too hard!",
      })
      .set("Authorization", `Bearer ${adminAccessToken}`)
      .expect(200)
      .expect((response) => {
        const entry = response.body[0];
        expect(entry.type).toBe("TOO_HARD");
        expect(entry.feedback).toBe("This challenge is too hard!");
        expect(entry.challengeId).toBe("9scykDold");
        expect(entry.updatedAt).toBeDefined();
        expect(entry.createdAt).toBeDefined();
      });

    done();
  });
});
