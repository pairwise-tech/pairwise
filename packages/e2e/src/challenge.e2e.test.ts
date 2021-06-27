import request from "supertest";
import { HOST } from "./utils/e2e-utils";

/** ===========================================================================
 * e2e Tests for /content APIs
 * ============================================================================
 */

describe("Challenge APIs", () => {
  test("/content/skeletons (GET)", () => {
    return request(`${HOST}/content/skeletons`)
      .get("/")
      .expect(200)
      .expect((response) => {
        expect(Array.isArray(response.body)).toBeTruthy();

        // Check course title
        const firstCourse = response.body[0];
        expect(firstCourse.title).toBe("Fullstack TypeScript");

        // Assert all of the challenge content has be sanitized:
        for (const course of response.body) {
          for (const courseModule of course.modules) {
            for (const challenge of courseModule.challenges) {
              expect(challenge.testCode).toBeUndefined();
              expect(challenge.instructions).toBeUndefined();
              expect(challenge.starterCode).toBeUndefined();
              expect(challenge.solutionCode).toBeUndefined();
              expect(challenge.content).toBeUndefined();
            }
          }
        }
      });
  });

  test("/content/:courseId (GET)", () => {
    return request(`${HOST}/content/courses`)
      .get("/")
      .expect(200)
      .expect((response) => {
        expect(Array.isArray(response.body)).toBe(true);
        // Check course
        const course = response.body[0];
        expect(course.title).toBe("Fullstack TypeScript");
        expect(Array.isArray(course.modules)).toBeTruthy();
      });
  });
});
