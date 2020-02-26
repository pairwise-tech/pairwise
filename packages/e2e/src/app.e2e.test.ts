import request from "supertest";
import { HOST } from "./utils/e2e-utils";

/** ===========================================================================
 * e2e tests for generic app APIs
 * ============================================================================
 */

describe("AppController (e2e)", () => {
  test("/ (GET) index route", () => {
    return request(HOST)
      .get("/")
      .expect(200)
      .expect("This is Pairwise 😎");
  });
});
