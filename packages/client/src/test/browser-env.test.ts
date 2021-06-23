import fs from "fs";

const options = { encoding: "utf8" };

const BROWSER_TEST_LIBRARY = fs.readFileSync(
  "src/js/browser-test-lib.js",
  options,
);

/**
 * These should only be enabled to the localhost variations for
 * local development - they should not be enabled on any commits
 * which merge to the main branch in production.
 */
describe("Check browser-test-lib environment variables", () => {
  test("Check DATABASE_CHALLENGE_API", () => {
    const line = BROWSER_TEST_LIBRARY.includes(
      `// const DATABASE_CHALLENGE_API = "http://localhost:5000";`,
    );
    expect(line).toBe(true);
  });

  test("Check PAIRWISE_CODE_RUNNER_API", () => {
    const line = BROWSER_TEST_LIBRARY.includes(
      `// const PAIRWISE_CODE_RUNNER_API = "http://localhost:8080";`,
    );
    expect(line).toBe(true);
  });
});
