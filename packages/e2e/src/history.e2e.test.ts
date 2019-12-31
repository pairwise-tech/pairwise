import axios from "axios";
import request from "supertest";
import { fetchAccessToken, HOST } from "./utils/e2e-utils";

/** ===========================================================================
 * e2e Tests for /progress APIs
 * ============================================================================
 */

describe.only("User Progress APIs", () => {
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
    request(`${HOST}/progress/challenge`)
      .post("/")
      .send({
        challengeId: "9scykDold",
        dataBlob: JSON.stringify({ code: "console.log('hello') " }),
      })
      .set("Authorization", authorizationHeader)
      .expect(201)
      .end((error, response) => {
        expect(response.text).toBe("Success");
        done(error);
      });
  });
});
