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
  const DEV_COMMENT = `// DEV = true; // Enable to use code execution APIs in development`;

  test("Check DATABASE_CHALLENGE_API", () => {
    const line = BROWSER_TEST_LIBRARY.includes(DEV_COMMENT);
    expect(line).toBe(true);
  });

  test("Check PAIRWISE_CODE_RUNNER_API", () => {
    const line = BROWSER_TEST_LIBRARY.includes(DEV_COMMENT);
    expect(line).toBe(true);
  });
});
