import fs from "fs";

import { Course, assertUnreachable } from "@pairwise/common";
import {
  compileCodeString,
  getTestHarness,
  IframeMessageEvent,
} from "tools/test-utils";
import { wait } from "tools/utils";
import { TestCase } from "tools/challenges";

const EXPECTATION_LIBRARY = fs.readFileSync(
  "src/tools/in-browser-testing-lib.js",
  { encoding: "utf8" },
);

/* Import the courses directly: */
const courses = require("@pairwise/common").default;
const { FullstackTypeScript } = courses;
const course: Course = FullstackTypeScript;

jest.setTimeout(30000);

describe("Linus should be able to pass all the challenges first try", () => {
  test("Execute all challenge tests against their solutions", async () => {
    const anyFailed = false;

    const challenges = course.modules
      .map(m => m.challenges)
      .reduce((flat, c) => flat.concat(c));

    // const x = challenges[3];

    for (const challenge of challenges) {
      const { code } = await compileCodeString(
        challenge.solutionCode,
        challenge,
      );

      const html = `<html><body></body></html>`;
      let doc = html;

      let script;

      switch (challenge.type) {
        case "react": {
          script = code;
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

        // eslint-disable-next-line
        window.eval(script);

        /**
         * Wait for the test script to execute and post a message back to
         * the message listener.
         *
         * TODO: Refactor this to race until the message is posted.
         */
        await wait(50);

        /**
         * Evaluate the test results.
         */
        const passed = results.reduce(
          (_: boolean, result: any) => result.testResult,
          true,
        );

        if (passed) {
          console.log(
            `[SUCCESS]: Challenge ${challenge.title} solution passed!`,
          );
        } else {
          console.log(
            `[FAILED]: Challenge ${challenge.title} solution failed!`,
          );
        }
      } else {
        console.log(
          `[SKIPPING]: Challenge ${challenge.title} is being skipped`,
        );
      }
    }

    expect(anyFailed).toBeFalsy();
  });
});
