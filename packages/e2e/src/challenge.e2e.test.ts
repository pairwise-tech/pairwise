import request from "supertest";
import { fetchAccessToken, HOST } from "./utils/e2e-utils";

/** ===========================================================================
 * e2e Tests for /challenge APIs
 * ============================================================================
 */

describe("Challenge APIs", () => {
  let accessToken;
  let authorizationHeader;

  beforeAll(async () => {
    accessToken = await fetchAccessToken();
    authorizationHeader = `Bearer ${accessToken}`;
  });

  test("/content/skeletons (GET)", () => {
    return request(`${HOST}/content/skeletons`)
      .get("/")
      .expect(200)
      .expect(response => {
        expect(Array.isArray(response.body)).toBeTruthy();
        expect(response.body[0].title).toBe("Fullstack TypeScript");

        /* Assert all of the challenge content has be sanitized: */
        for (const course of response.body) {
          for (const courseModule of course.modules) {
            for (const challenge of courseModule.challenges) {
              expect(challenge.testCode).toBeUndefined();
              expect(challenge.content).toBeUndefined();
              expect(challenge.starterCode).toBeUndefined();
              expect(challenge.solutionCode).toBeUndefined();
              expect(challenge.supplementaryContent).toBeUndefined();
            }
          }
        }
      });
  });

  test("/content/:courseId (GET)", () => {
    return request(`${HOST}/content/course/fpvPtfu7s`)
      .get("/")
      .expect(200)
      .expect(response => {
        expect(response.body.title).toBe("Fullstack TypeScript");
        expect(Array.isArray(response.body.modules)).toBeTruthy();
      });
  });
});
