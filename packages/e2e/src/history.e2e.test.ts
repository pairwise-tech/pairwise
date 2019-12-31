import axios from "axios";
import request from "supertest";
import { fetchAccessToken, HOST } from "./utils/e2e-utils";

jest.setTimeout(30000);

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
    request(`${HOST}/progress/challenge`)
      .post("/")
      .send({
        challengeId: "9scykDold",
        dataBlob: JSON.stringify({ code: "console.log('hello') " }),
      })
      .set("Authorization", "Bearer as8fd7a0")
      .expect(401)
      .end((error, response) => {
        expect(response.body.error).toBe("Unauthorized");
        done(error);
      });
  });

  test("/challenge (POST) rejects invalid challenge ids", async done => {
    request(`${HOST}/progress/challenge`)
      .post("/")
      .send({
        challengeId: "sa7sa7f7f",
        dataBlob: JSON.stringify({ code: "console.log('hello') " }),
      })
      .set("Authorization", authorizationHeader)
      .expect(400)
      .end((error, response) => {
        expect(response.body.message).toBe("The challengeId is invalid");
        done(error);
      });
  });

  test("/challenge (POST) inserts and updates valid requests", async done => {
    /**
     * Helper to fetch progress history for a challenge id.
     */
    const fetchProgressHistory = async (challengeId: string) => {
      const result = await axios.get(
        `${HOST}/progress/challenge/${challengeId}`,
        {
          headers: {
            Authorization: authorizationHeader,
          },
        },
      );
      return result.data;
    };

    /**
     * [1] Request returns 404 initially.
     */
    await request(`${HOST}/progress/challenge/9scykDold`)
      .get("/")
      .set("Authorization", authorizationHeader)
      .expect(404);

    /**
     * [2] Update the challenge history.
     */
    await request(`${HOST}/progress/challenge`)
      .post("/")
      .send({
        challengeId: "9scykDold",
        dataBlob: JSON.stringify({ code: "console.log('Hello!!!')" }),
      })
      .set("Authorization", authorizationHeader)
      .expect(201)
      .expect(response => {
        expect(response.text).toBe("Success");
      });

    /**
     * [3] Fetch the result and verify it contains the updated data.
     */
    let progress = await fetchProgressHistory("9scykDold");
    expect(progress.uuid).toBeDefined();
    expect(progress.challengeId).toBe("9scykDold");
    expect(progress.dataBlob).toBe(`{"code":"console.log(\'Hello!!!\')"}`);

    /**
     * [4] Update again.
     */
    await request(`${HOST}/progress/challenge`)
      .post("/")
      .send({
        challengeId: "9scykDold",
        dataBlob: JSON.stringify({
          code: "console.log('Hello from Taiwan!') ",
        }),
      })
      .set("Authorization", authorizationHeader)
      .expect(201)
      .expect(response => {
        expect(response.text).toBe("Success");
      });

    /**
     * [5] Update some other challenge history.
     */
    await request(`${HOST}/progress/challenge`)
      .post("/")
      .send({
        challengeId: "6T3GXc4ap",
        dataBlob: JSON.stringify({
          code: "// Some other code string!",
        }),
      })
      .set("Authorization", authorizationHeader)
      .expect(201)
      .expect(response => {
        expect(response.text).toBe("Success");
      });

    /**
     * [6] Check the updated occurred correctly.
     */
    progress = await fetchProgressHistory("9scykDold");
    expect(progress.uuid).toBeDefined();
    expect(progress.challengeId).toBe("9scykDold");
    expect(progress.dataBlob).toBe(
      `{"code":"console.log(\'Hello from Taiwan!\') "}`,
    );

    done();
  });
});
