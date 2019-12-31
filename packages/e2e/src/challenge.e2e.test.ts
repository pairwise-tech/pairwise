import request from "supertest";
import { fetchAccessToken, HOST } from "./utils/utils";

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

  test("/challenges (GET)", () => {
    return request(`${HOST}/challenges`)
      .get("/")
      .expect(200)
      .expect(response => {
        expect(response.body.title).toBe("Fullstack TypeScript");
        expect(Array.isArray(response.body.modules)).toBeTruthy();
      });
  });
});
