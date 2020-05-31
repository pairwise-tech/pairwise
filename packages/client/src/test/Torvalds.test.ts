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

jest.setTimeout(30000);

/**
 * Import the expectation library. Read the file directly with Node because
 * Jest doesn't understand Webpack raw-loader. Take that Jest!
 */
const EXPECTATION_LIBRARY = fs.readFileSync("src/js/browser-test-lib.js", {
  encoding: "utf8",
});

/**
 * Import the courses directly. In the future if there are multiple courses
 * this could be slightly refactored to just use all the courses.
 */
const courses = require("@pairwise/common").default;
const { FullstackTypeScript } = courses;
const course: Course = FullstackTypeScript;

/* Debug options, add challenge ids here to debug them directly: */
const DEBUG = false;
const TEST_ID_WHITELIST = new Set(["iFvzasqW"]);

// Allow manually skipping challenges. It's dangerous because this means these
// are challenges with tests that will _NOT_ be tested in the UI. Why in the
// world would you do this!?! Limitations of the JSDOM environment.
// NOTE: I'm leaving this commented-out ID in here for now in case it happens
// again in the future. The test env is bad at inheritted styles. That
// particular test was failing becuase I had applied color:white; to the body
// tag and not p tags directly.
const DANGEROUSLY_SKIP_CHALLENGE = new Set([
  "Ao8hbaiP", // Test env seems to be having trouble calculating the midpoint of a bounding box.
  // "pUf7$Qi2y", // Could not test that p tags are white... WHY? See NOTE
]);

/* Enable or disable log info */
const LOG = true;

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
      .map(m => m.challenges)
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

    /* Get all the challenges */
    const challenges = course.modules.flatMap(m => m.challenges);

    /* For every challenge, execute the tests */
    outerLoop: for (const challenge of challenges) {
      if (DEBUG) {
        if (!TEST_ID_WHITELIST.has(challenge.id)) {
          continue;
        }
      }

      if (DANGEROUSLY_SKIP_CHALLENGE.has(challenge.id)) {
        log.skipDangerously(challenge);
        continue;
      }

      const html = `<html><body></body></html>`;
      let doc = html;

      let script;

      /* Process the different challenge types and get the test code */
      switch (challenge.type) {
        case "react": {
          const code = await compileSolutionCode(challenge);
          doc = `<html><body><div id="root"></div></body></html>`;
          script = `${EXPECTATION_LIBRARY}\n${code}`;
          break;
        }
        case "typescript": {
          const code = await compileSolutionCode(challenge);
          script = `${EXPECTATION_LIBRARY}\n${code}`;
          break;
        }
        case "markup": {
          doc = challenge.solutionCode;
          script = `${EXPECTATION_LIBRARY}\n${getTestHarness(
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
          continue outerLoop;
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

        /**
         * Wait briefly for the test script to execute and post a message back
         * to the message listener.
         *
         * NOTE: It could be an issue if the tests do not complete in 100
         * milliseconds. If that's the case, we could try to implement some
         * polling logic to wait until the tests are populated.
         */
        try {
          wait(100);
        } catch (err) {
          // waitForResults can throw, it may if the polling timeout is
          // exceeded. Catch the error here and handle it as a failed test.
          results = [
            {
              testResult: false,
              test: "Running waitForResults to retrieve test results",
              message:
                "waitForResults threw and error, probably because of a timeout",
            },
          ];
        }
      }

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
        log.fail(challenge);
      } else {
        log.success(challenge);
      }

      // Add any failed tests for the current challenge to the overall list.
      failedTests = failedTests.concat(currentFailedTests);
    }

    expect(failedTests).toEqual([]);
  });
});

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

  // @ts-ignore
  // eslint-disable-next-line
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
