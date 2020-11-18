import axios from "axios";
import request from "supertest";
import { fetchAccessToken, HOST } from "./utils/e2e-utils";

/** ===========================================================================
 * e2e Tests for /progress APIs
 * ============================================================================
 */

describe("User Progress APIs", () => {
  let accessToken;
  let authorizationHeader;

  beforeAll(async () => {
    accessToken = await fetchAccessToken();
    authorizationHeader = `Bearer ${accessToken}`;
  });

  test("/challenge (POST) requires an authenticated user", async done => {
    request(`${HOST}/blob`)
      .post("/")
      .send({
        challengeId: "9scykDold",
        dataBlob: { code: "console.log('hello');", type: "challenge" },
      })
      .set("Authorization", "Bearer as8fd7a0")
      .expect(401)
      .end((error, response) => {
        expect(response.body.message).toBe("Unauthorized");
        done(error);
      });
  });

  test("/challenge (GET) rejects invalid challenge ids", async done => {
    request(`${HOST}/blob/fs78dfa79adsf7saf`)
      .get("/")
      .set("Authorization", authorizationHeader)
      .expect(400)
      .end((error, response) => {
        expect(response.body.message).toBe("Invalid parameters provided.");
        done(error);
      });
  });

  test("/challenge (POST) rejects invalid challenge ids", async done => {
    request(`${HOST}/blob`)
      .post("/")
      .send({
        challengeId: "sa7sa7f7f",
        dataBlob: { code: "console.log('hello');", type: "challenge" },
      })
      .set("Authorization", authorizationHeader)
      .expect(400)
      .end((error, response) => {
        expect(response.body.message).toBe("The challengeId is invalid.");
        done(error);
      });
  });

  test("/challenge (POST) inserts and updates valid requests", async done => {
    // Helper to fetch progress history for a challenge id.
    const fetchProgressHistory = async (challengeId: string) => {
      const result = await axios.get(`${HOST}/blob/${challengeId}`, {
        headers: {
          Authorization: authorizationHeader,
        },
      });
      return result.data;
    };

    // Request returns 404 initially.
    await request(`${HOST}/blob/9scykDold`)
      .get("/")
      .set("Authorization", authorizationHeader)
      .expect(404);

    // Update the challenge history.
    await request(`${HOST}/blob`)
      .post("/")
      .send({
        challengeId: "9scykDold",
        dataBlob: { code: "console.log('Hello!!!')", type: "challenge" },
      })
      .set("Authorization", authorizationHeader)
      .expect(201)
      .expect(response => {
        expect(response.text).toBe("Success");
      });

    // Fetch the result and verify it contains the updated data.
    let progress = await fetchProgressHistory("9scykDold");
    expect(progress.uuid).toBeDefined();
    expect(progress.challengeId).toBe("9scykDold");
    expect(progress.dataBlob).toEqual({
      code: "console.log('Hello!!!')",
      type: "challenge",
    });

    // Update again.
    await request(`${HOST}/blob`)
      .post("/")
      .send({
        challengeId: "9scykDold",
        dataBlob: {
          type: "challenge",
          code: "console.log('Hello from Taiwan!');",
        },
      })
      .set("Authorization", authorizationHeader)
      .expect(201)
      .expect(response => {
        expect(response.text).toBe("Success");
      });

    // Update some other challenge history.
    await request(`${HOST}/blob`)
      .post("/")
      .send({
        challengeId: "6T3GXc4ap",
        dataBlob: {
          type: "challenge",
          code: "// Some other code string!",
        },
      })
      .set("Authorization", authorizationHeader)
      .expect(201)
      .expect(response => {
        expect(response.text).toBe("Success");
      });

    // Check the updated occurred correctly.
    progress = await fetchProgressHistory("9scykDold");
    expect(progress.uuid).toBeDefined();
    expect(progress.challengeId).toBe("9scykDold");
    expect(progress.dataBlob).toEqual({
      type: "challenge",
      code: "console.log('Hello from Taiwan!');",
    });

    // Check that the user's lastActiveChallengeId updated again.
    progress = await fetchProgressHistory("6T3GXc4ap");

    // Update some challenge history from a different course.
    await request(`${HOST}/blob`)
      .post("/")
      .send({
        challengeId: "t$oXPf22$",
        dataBlob: {
          type: "challenge",
          code: "// Some other code string!",
        },
      })
      .set("Authorization", authorizationHeader)
      .expect(201)
      .expect(response => {
        expect(response.text).toBe("Success");
      });

    done();
  });
});
