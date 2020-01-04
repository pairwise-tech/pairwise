import request from "supertest";
import { HOST, HARD_CODED_FB_ACCESS_TOKEN } from "./utils/e2e-utils";

/** ===========================================================================
 * e2e Tests for /auth APIs
 * ============================================================================
 */

describe("Auth APIs", () => {
  test("/auth/facebook (GET) - invalid", () => {
    return request(`${HOST}/auth/facebook`)
      .get("/")
      .expect(401);
  });

  test("/auth/facebook (GET) - valid", () => {
    return request(
      `${HOST}/auth/facebook?access_token=${HARD_CODED_FB_ACCESS_TOKEN}`,
    )
      .get("/")
      .expect(200)
      .expect(response => {
        expect(response.body.accessToken).toBeDefined();
      });
  });

  test("/auth/gihub (GET) - valid", () => {
    return request(`${HOST}/auth/github`)
      .get("/")
      .expect(200)
      .expect(response => {
        console.log(response.body);
        expect(response.body.accessToken).toBeDefined();
      });
  });
});
