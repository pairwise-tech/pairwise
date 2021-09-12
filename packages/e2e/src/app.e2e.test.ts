import request from "supertest";
import ENV from "./utils/e2e-env";

/** ===========================================================================
 * e2e tests for generic app APIs
 * ============================================================================
 */

describe("AppController (e2e)", () => {
  test("/ (GET) index route", () => {
    return request(ENV.HOST).get("/").expect(200).expect("This is Pairwise 😎");
  });
});
