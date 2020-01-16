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

/* Import the expectation library */
const EXPECTATION_LIBRARY = fs.readFileSync(
  "src/tools/in-browser-testing-lib.js",
  { encoding: "utf8" },
);

/* Import the courses directly: */
const courses = require("@pairwise/common").default;
const { FullstackTypeScript } = courses;
const course: Course = FullstackTypeScript;

/* Debug options, add challenge ids here to debug them directly: */
const DEBUG = true;
const TEST_ID_WHITELIST = new Set(["50f7f8sUV"]);

/** ===========================================================================
 * Test
 * ============================================================================
 */

describe("Linus should be able to pass all the challenges first try", () => {
  test("Execute all challenge tests against their solutions", async () => {
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
          break;
        }
        default: {
          assertUnreachable(challenge.type);
        }
      }

      let results: TestCase[] = [];

      if (script) {
        document.body.innerHTML = doc;
        window.parent.postMessage = (data: IframeMessageEvent["data"]) => {
          const { source, message } = data;
          if (source === "TEST_RESULTS") {
            results = JSON.parse(message);
          }
        };

        try {
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
         *
         * TODO: Refactor this to race until the message is posted.
         */
        await wait(250);

        if (DEBUG) {
          console.log(results);
        }

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

        anyFailed = !anyFailed ? true : !passed; /* blegh */

        if (passed) {
          log.success(challenge);
        } else {
          log.fail(challenge);
        }
      } else {
        log.skip(challenge);
      }
    }

    expect(anyFailed).toBeFalsy(); /* Some tests failed! */
  });
});

/** ===========================================================================
 * Log Util
 * ============================================================================
 */

const getChallengeLog = (challenge: Challenge) => {
  return `: ${challenge.id}\n- Type: ${challenge.type}\n- Title: ${challenge.title}`;
};

const log = {
  success: (challenge: Challenge) => {
    console.log(`[SUCCESS]${getChallengeLog(challenge)}`);
  },
  fail: (challenge: Challenge) => {
    console.log(`[FAILED]${getChallengeLog(challenge)}`);
  },
  skip: (challenge: Challenge) => {
    console.log(`[SKIPPED]${getChallengeLog(challenge)}`);
  },
};
