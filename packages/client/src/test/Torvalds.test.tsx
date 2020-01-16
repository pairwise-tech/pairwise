import fs from "fs";

import { Course, assertUnreachable, Challenge } from "@pairwise/common";
import {
  compileCodeString,
  getTestHarness,
  IframeMessageEvent,
} from "tools/test-utils";
import { wait } from "tools/utils";
import { TestCase } from "tools/challenges";

/** ===========================================================================
 * Config & Utils
 * ============================================================================
 */

jest.setTimeout(30000);

/**
 * Import the expectation library. Read the file directly with Node because
 * Jest doesn't understand Webpack raw-loader. Take that Jest!
 */
const EXPECTATION_LIBRARY = fs.readFileSync(
  "src/tools/in-browser-testing-lib.js",
  { encoding: "utf8" },
);

/**
 * Import the courses directly. In the future if there are multiple courses
 * this could be slightly refactored to just use all the courses.
 */
const courses = require("@pairwise/common").default;
const { FullstackTypeScript } = courses;
const course: Course = FullstackTypeScript;

/* Debug options, add challenge ids here to debug them directly: */
const DEBUG = false;
const TEST_ID_WHITELIST = new Set(["KlxN3f11"]);

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
  test("Execute all challenge tests against their solution code", async () => {
    let anyFailed = false;

    /* Get all the challenges */
    const challenges = course.modules
      .map(m => m.challenges)
      .reduce((flat, c) => flat.concat(c));

    /* For every challenge, execute the tests */
    for (const challenge of challenges) {
      if (DEBUG) {
        if (!TEST_ID_WHITELIST.has(challenge.id)) {
          continue;
        }
      }

      const { code } = await compileCodeString(
        challenge.solutionCode,
        challenge,
      );

      const html = `<html><body></body></html>`;
      let doc = html;

      let script;

      /* Process the different challenge types and get the test code */
      switch (challenge.type) {
        case "react": {
          doc = `<html><body><div id="root"></div></body></html>`;
          script = `${EXPECTATION_LIBRARY}\n${code}`;
          break;
        }
        case "typescript": {
          script = `${EXPECTATION_LIBRARY}\n${code}`;
          break;
        }
        case "markup": {
          doc = challenge.solutionCode;
          script = `${EXPECTATION_LIBRARY}\n${getTestHarness(
            challenge.testCode,
          )}`;
          break;
        }
        case "media": {
          /* No tests for these challenges */
          break;
        }
        default: {
          assertUnreachable(challenge.type);
        }
      }

      let results: TestCase[] = [];

      if (script) {
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
          /* Evaluate the test script */
          // eslint-disable-next-line
          window.eval(script);
        } catch (err) {
          console.error("Error thrown from window.eval!", err);

          /* The test failed, enter a failed test case manually */
          const failedTestCase = { testResult: false };
          results = [failedTestCase as TestCase];
        }

        /**
         * Wait for the test script to execute and post a message back to
         * the message listener.
         */
        await waitForResults({ results });

        /**
         * Evaluate the test results.
         */
        let passed = true;
        for (const result of results) {
          const { testResult } = result;
          if (!testResult) {
            passed = false;
          }
        }

        if (passed) {
          log.success(challenge);
        } else {
          /* A test failed, mark it to fail the entire test suite later */
          anyFailed = true;
          log.fail(challenge);
        }
      } else {
        log.skip(challenge);
      }
    }

    expect(!anyFailed).toBeTruthy();
  });
});

/** ===========================================================================
 * Utils
 * ============================================================================
 */

/**
 * Create a method which takes the results array and polls it every poll
 * interval until it has values inside, and then resolves.
 */
const pollResults = (results: TestCase[], poll: number) => {
  return new Promise(function(resolve, _) {
    setTimeout(() => {
      if (results.length) {
        if (DEBUG) {
          console.log(results);
        }
        resolve("done");
      }
    }, poll);
  });
};

/**
 * Timeout to race against the pollResults function. Throws if the timeout
 * is exceeded.
 */
const timeout = async (limit: number) => {
  await wait(limit);
  throw new Error("Waiting for results but timeout exceeded!");
};

/**
 * Take the results and poll until it is populated, or else fail after some
 * generous time limit.
 */
const waitForResults = async ({
  poll = 10,
  limit = 250,
  results,
}: {
  poll?: number;
  limit?: number;
  results: TestCase[];
}) => {
  await Promise.race([pollResults(results, poll), timeout(limit)]);
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
    const msg = `[FAILED]${log.getMessage(challenge)}`;
    log.print(msg);
  },
  skip: (challenge: Challenge) => {
    const msg = `[SKIPPED]${log.getMessage(challenge)}`;
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
