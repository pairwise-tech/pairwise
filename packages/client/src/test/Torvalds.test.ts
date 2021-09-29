import fs from "fs";
import { Course, assertUnreachable, Challenge } from "@pairwise/common";
import {
  compileCodeString,
  getTestHarness,
  IframeMessageEvent,
  TestCase,
} from "tools/test-utils";
import { wait } from "tools/utils";
import stripComments from "strip-comments";

/** ===========================================================================
 * Config & Utils
 * ============================================================================
 */

/**
 * Test Rust challenges by running the yarn test:watch:rust command. You
 * will need the code-runner-api running locally as well.
 */
const TEST_RUST = process.env.TEST_RUST_CHALLENGES === "true";

/**
 * Huge timeout! This timeout applies to the entire running test time, and
 * should be sufficient to run ALL of the challenge tests. This is a lot
 * so the timeout is excessively long.
 *
 * Check the waitForResultsUntilTimeout method in the test file below for
 * the logic which handles timing out individual challenge tests. This timer
 * logic is set to a maximum to 15 seconds.
 */
jest.setTimeout(180000); // -> 3 minutes

const options = { encoding: "utf8" };

/**
 * Import the expectation library. Read the file directly with Node because
 * Jest doesn't understand Webpack raw-loader. Take that Jest!
 */
const BROWSER_TEST_LIBRARY = fs.readFileSync(
  "src/js/browser-test-lib.js",
  options,
);

const TEST_EXPECTATION_LIBRARY = fs.readFileSync(
  "src/js/test-expectation-lib.js",
  options,
);

const EXPRESS_JS_LIBRARY = fs.readFileSync("src/js/express-js-lib.js", options);

const WORKSPACE_LIB = `
  ${BROWSER_TEST_LIBRARY}
  ${TEST_EXPECTATION_LIBRARY}
  ${EXPRESS_JS_LIBRARY}
`;

/**
 * Import the courses directly. In the future if there are multiple courses
 * this could be slightly refactored to just use all the courses.
 */
// eslint-disable-next-line
const courses = require("@pairwise/common").default;
const { FullstackTypeScript, Rust } = courses;
let course: Course = TEST_RUST ? Rust : FullstackTypeScript;

// NOTE: Enable debug mode. Inspect challenges directly by id. Should
// only be used for debugging.
const DEBUG = false;
const TEST_ID_WHITELIST = new Set(["ifuAxpSly"]);

// Allow manually skipping challenges. It's dangerous because this means these
// are challenges with tests that will _NOT_ be tested in the UI. Why in the
// world would you do this!?! Limitations of the JSDOM environment.
// NOTE: I'm leaving this commented-out ID in here for now in case it happens
// again in the future. The test env is bad at inherited styles. That
// particular test was failing because I had applied color:white; to the body
// tag and not p tags directly.
const DANGEROUSLY_SKIP_CHALLENGE = new Set([
  // *************************************************************************
  // Test env seems to be having trouble calculating the midpoint of a bounding box.
  "Ao8hbaiP",
  // *************************************************************************
  // NOTE: The next 5 ids are the Async Module Practice with APIs challenges,
  // which all call external service APIs. These are disabled in the test environment.
  // These were tested after creation to ensure they worked, and then disabled.
  // A better solution might be to somehow mock these external APIs (?).
  "CgstSAbnS",
  "yYHjlEO$4",
  "hbAfMbUAT0",
  "RBkHLlPHT",
  "aC5pqM5B6",
  // *************************************************************************
  // Two other challenges which also use external APIs:
  "EoK0U8Q$0", // Fetching Data Asynchronously
  "rShMOVugA", // Quote of the Day Challenge
  // *************************************************************************
  // Database challenges, which rely on the external Database Challenge API.
  // These could be run locally with that API running locally.
  "2W$NOg9P@",
  "a06u3l6bq",
  "LvJ5cydPJ",
  "uV1$K76hF",
  "exRKTrTQ53",
  "DfnyaGCiN",
  "Zp3SXuzsQ",
  "HEVmqrnq9O",
  "JEKexIggwe",
  "S0x08sXPyb",
  "R1df1YKNu",
  "@y2Fske3k",
  "1UZ0kAsQG",
  "LS11pYav1",
  "EnwGWEoLN",
  "4LAL2bAsrH",
  "jnPsb7B2q",
  "sinu3XtS9",
  "OfmIBiktX",
  "XYliURkbb",
  "ogGvBc5sl",
  "Q6wrmX6TN",
  "LzZJLUJI0",
  "wf9ggEKbq",
  // *************************************************************************
  // React Native challenges:
  "zKZu8XMJz", // Some issue checking CSS styles
  "61iScTEvN", // Another styles issue
  "LITUB9VZ6", // More styling issues
  "fkx7YqjKA", // Styling...

  // *************************************************************************
  // Testing Software challenges: Jest "tests cannot be nested" WTF!
  "kGOefnhFl",
  "l0IkyZi$m",
  "2EkzeSu52",
  "cpGNKdx5s",
  "2j9vhRMjW",
  "zdV1F5Bdb",
  "gYpNeTnG1",
  "zCbzABROtb",
  "e8LMnAF1U",
  "Vd0gFPl5V",
  "v1sB3gaFR",
  "qUXuU6Tyr",
  "qU36RQTcK",
  "oNwi40jtp",
  "yKI$72Y7v",
  "4X8ks1Rz",
  "8gYWsIVO",
]);

// Enable or disable log info
const LOG = true;

// Enable logging messages from the test environment
const ENABLE_TEST_LOG = false;

/** ===========================================================================
 * Test
 * ----------------------------------------------------------------------------
 * - This currently takes all the challenges and executes their tests against
 * their solution code. It is a little hacked together right now.
 *
 * - If, in the future some challenges had to run in a server environment,
 * then those challenges would have APIs to run the tests. At that time,
 * the functions were prepare the code to be tested could be moved to the
 * common package, and then the tests could be moved to e2e. Then, any tests
 * which require running on the server could just be sent directly to the
 * server API which would be running while the test suite runs.
 * ============================================================================
 */

describe("Linus should be able to pass all the challenges first try", () => {
  // NOTE: This only checks the current 1 course. If additional courses are
  // ever added this will need to accommodate those as well.
  test("Verify all shortid generated ids are unique, just in case!", () => {
    // Create a set with the course id
    const challengeIdSet = new Set([course.id]);

    // Get all the challenges
    const challenges = course.modules
      .map((m) => m.challenges)
      .reduce((flat, c) => flat.concat(c));

    // Check all the module ids
    for (const { id } of course.modules) {
      if (challengeIdSet.has(id)) {
        throw new Error(`Found duplicated id! The culprit: ${id}`);
      }

      challengeIdSet.add(id);
    }

    // Check all the challenge ids
    for (const { id } of challenges) {
      if (challengeIdSet.has(id)) {
        throw new Error(`Found duplicated id! The culprit: ${id}`);
      }

      challengeIdSet.add(id);
    }
  });

  test("Execute all challenge tests against their solution code", async () => {
    let failedTests: string[] = [];
    let failedChallenges: Challenge[] = [];

    /* Get all the challenges */
    const challenges = course.modules.flatMap((m) => m.challenges);

    let passed = 0;
    let failed = 0;
    let skipped = 0;

    /* For every challenge, execute the tests */
    for (const challenge of challenges) {
      if (DEBUG) {
        if (!TEST_ID_WHITELIST.has(challenge.id)) {
          continue;
        }
      }

      if (DANGEROUSLY_SKIP_CHALLENGE.has(challenge.id)) {
        skipped++;
        log.skipDangerously(challenge);
        continue;
      }

      // Run the tests on the challenge and get the results
      const results = await executeTests(challenge);

      /**
       * Evaluate the test results. There are potentially many result objects
       * for a given challenge.
       */
      const currentFailedTests: string[] = [];
      for (const result of results) {
        if (!result.testResult) {
          currentFailedTests.push(
            `{${challenge.title}} ${result.message}\n${result.error}`,
          );
        }
      }

      if (currentFailedTests.length) {
        failed++;
        failedChallenges.push(challenge);
        log.fail(challenge);
      } else {
        passed++;
        log.success(challenge);
      }

      // Add any failed tests for the current challenge to the overall list.
      failedTests = failedTests.concat(currentFailedTests);
    }

    console.log(`-> Challenge Tests Passed:  ${passed}`);
    console.log(`-> Challenge Tests Skipped: ${skipped}`);
    console.log(`-> Challenge Tests Failed:  ${failed}`);

    // Log out failed challenge results:
    if (failed > 0) {
      console.log(`-> Failed Challenges:`);
    }

    for (const x of failedChallenges) {
      console.log(`- Failed Challenge: ${x.id} - ${x.title}`);
    }

    expect(failedTests).toEqual([]);
  });

  test("Torvalds identifies failing tests", async () => {
    if (TEST_RUST) {
      expect(true).toBe(true);
    } else {
      // An example challenge with a failing solution
      const failedChallengeTests: Challenge = {
        id: "6f7$Xc4ap",
        type: "typescript",
        title: "Add Two Numbers",
        instructions:
          "Complete the function body below. The function should receive two numbers as input arguments and return the result of adding these numbers together.",
        starterCode:
          "const addTwoNumbers = (a: number, b: number) => {\n  // Your code here\n}\n\nconst result = addTwoNumbers(10, 20);\nconsole.log(result);\n",
        solutionCode:
          "const addTwoNumbers = (a: number, b: number) => {\n  return a * b;\n}\n\nconst result = addTwoNumbers(10, 20);\nconsole.log(result);\n",
        testCode:
          "const cases = [\n  { input: [1, 2], expected: 3 },\n  { input: [10, 50], expected: -600 },\n  { input: [-10, -50], expected: -6000 },\n  { input: [100, 500], expected: 1000 },\n  { input: [1123, 532142], expected: 533265 },\n  { input: [-10, 50], expected: 40 },\n  { input: [1, 500], expected: 501 },\n  { input: [842, 124], expected: 966 },\n  { input: [1000, 500], expected: 1500 },\n  { input: [-100, 100], expected: 0 },\n  { input: [2, 50234432], expected: 50234434 },\n];\n\ncases.forEach(x => {\n    const { input: [a, b], expected } = x;\n    test(`adding the inputs`, () => {\n        expect(addTwoNumbers(a,b)).toBe(expected)\n    })\n})",
        content: "",
        videoUrl: "",
      };

      // Run the tests on the challenge and get the results
      const results = await executeTests(failedChallengeTests);

      // Results should not be empty
      expect(results.length).toBe(11);

      // All test results should fail
      for (const result of results) {
        expect(result.testResult).toBe(false);
        expect(typeof result.error).toBe("string");
      }
    }
  });
});

/** ===========================================================================
 * Test Runner
 * ============================================================================
 */

const executeTests = async (challenge: Challenge) => {
  const html = `<html><body></body></html>`;
  let doc = html;
  let script;

  /* Process the different challenge types and get the test code */
  switch (challenge.type) {
    case "react": {
      if (TEST_RUST) {
        return [];
      }

      const code = await compileSolutionCode(challenge);
      doc = `<html><body><div id="root"></div></body></html>`;
      script = `${WORKSPACE_LIB}\n${code}`;
      break;
    }
    case "typescript": {
      if (TEST_RUST) {
        return [];
      }

      const code = await compileSolutionCode(challenge);
      script = `${WORKSPACE_LIB}\n${code}`;
      break;
    }
    case "markup": {
      if (TEST_RUST) {
        return [];
      }

      doc = challenge.solutionCode;
      script = `${WORKSPACE_LIB}\n${getTestHarness(
        "",
        doc,
        challenge.testCode,
      )}`;
      break;
    }
    case "section":
    case "media":
    case "project":
    case "guided-project":
    case "special-topic": {
      /* No tests for these challenges */
      log.skip(challenge);
      // continue outerLoop;
      return [];
    }
    case "python":
    case "golang": {
      log.skip(challenge);
      return [];
    }
    // Enable to check Rust challenges
    case "rust": {
      if (TEST_RUST) {
        const code = await compileSolutionCode(challenge);
        script = `${WORKSPACE_LIB}\n${code}`;
        break;
      } else {
        log.skip(challenge);
        return [];
      }
    }
    default: {
      assertUnreachable(challenge.type);
    }
  }

  let results: TestCase[] = [];

  // The test code string might not be empty but still have no test code so we run this check.
  const hasTestCode = stripComments(challenge.testCode).trim();

  if (!hasTestCode) {
    results = results.concat([
      {
        testResult: false,
        test: "Zero test cases",
        message: `No test cases found for challenge [${challenge.id}] ${challenge.title}. Maybe this should be a media challenge?`,
      },
    ]);
  } else {
    /* Load the document */
    document.body.innerHTML = doc;

    /* Add the message listener */
    window.parent.postMessage = (data: IframeMessageEvent["data"]) => {
      const { source, message } = data;
      if (source === "TEST_RESULTS") {
        results = JSON.parse(message);
      } else if (source === "LOG" && ENABLE_TEST_LOG) {
        // Log messages sent out from the test code execution. Useful for
        // debugging test failures.
        console.log(message);
      }
    };

    try {
      handleAbsurdScriptEvaluation(script);
    } catch (err) {
      console.error("Error thrown from window.eval!", err);

      /* The test failed, enter a failed test case manually */
      const failedTestCase = { testResult: false };
      results = [failedTestCase as TestCase];
    }

    try {
      /**
       * Recursively await the tests results. The total limit is 25 seconds
       * with an interval of 50 milliseconds. This should allow the majority
       * of tests to complete quickly will still allowing a generous wait
       * time for longer running tests, e.g. async tests.
       */
      const waitForResultsUntilTimeout = async (
        remainingTries = 500,
      ): Promise<void> => {
        if (results.length > 0) {
          // Test results have been received.
          return;
        } else if (remainingTries === 0) {
          // Retry limit of ~500ms reached with no results - fail the test
          results = [
            {
              testResult: false,
              test: "Waiting for the tests to complete",
              message:
                "The waitLoop ran out of retries waiting to receive the test results.",
            },
          ];
          return;
        } else {
          // Results not found yet, continue retrying
          await wait(50);
          return waitForResultsUntilTimeout(remainingTries - 1);
        }
      };

      // Run the wait loop
      await waitForResultsUntilTimeout();
    } catch (err) {
      // Catch any errors from above and populate a failure message
      results = [
        {
          testResult: false,
          test: "Waiting for the tests to complete",
          message: `An error was thrown when waiting for the test results: ${err.message}`,
        },
      ];
    }
  }

  return results;
};

/** ===========================================================================
 * Utils
 * ============================================================================
 */

/**
 * Ha! Take that! Read it and weep!
 *
 * The evaluation of the script will result in setting properties on
 * the window object, which may overwrite existing properties such as the
 * Jest expect object. Here we preserve the original window and reset it after
 * evaluating the script to avoid frightening side effects of this.
 */
const handleAbsurdScriptEvaluation = (script: string) => {
  const JestExpect = expect;

  /* Evaluate the test script */
  // eslint-disable-next-line
  window.eval(script);

  // eslint-disable-next-line
  // @ts-ignore
  expect = JestExpect;
};

const compileSolutionCode = async (challenge: Challenge) => {
  const { code } = await compileCodeString(challenge.solutionCode, challenge);
  return code;
};

/**
 * Log helper
 */
const log = {
  success: (challenge: Challenge) => {
    const msg = `[SUCCESS]${log.getMessage(challenge)}`;
    log.print(msg);
  },
  fail: (challenge: Challenge) => {
    const msg = `>>> [FAILED]${log.getMessage(challenge)}`;
    log.print(msg);
  },
  skip: (challenge: Challenge) => {
    const msg = `[SKIPPED]${log.getMessage(challenge)}`;
    log.print(msg);
  },
  skipDangerously: (challenge: Challenge) => {
    const msg = `[SKIPPED DANGEROUSLY] Test won't run in CI but will in browser for ${log.getMessage(
      challenge,
    )}`;
    log.print(msg);
  },
  getMessage: (challenge: Challenge) => {
    return `: Challenge type: ${challenge.type}, title: ${challenge.title}, id: ${challenge.id}`;
  },
  print: (msg: string) => {
    if (LOG) {
      console.log(msg);
    }
  },
};
