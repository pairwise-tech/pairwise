import fs from "fs";

import { Course, assertUnreachable } from "@pairwise/common";
import {
  compileCodeString,
  getTestHarness,
  IframeMessageEvent,
} from "tools/test-utils";
import { wait } from "tools/utils";

const EXPECTATION_LIBRARY = fs.readFileSync(
  "src/tools/in-browser-testing-lib.js",
  { encoding: "utf8" },
);

/* Import the courses directly: */
const courses = require("@pairwise/common").default;
const { FullstackTypeScript } = courses;
const course: Course = FullstackTypeScript;

describe("Linus should be able to pass all the challenges first try", () => {
  test("Execute all challenge tests against their solutions", async () => {
    const challenges = course.modules
      .map(m => m.challenges)
      .reduce((flat, c) => flat.concat(c));

    const x = challenges[3];

    for (const challenge of [x]) {
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

      if (script) {
        document.body.innerHTML = doc;
        window.parent.postMessage = (data: IframeMessageEvent["data"]) => {
          const { source, message } = data;
          if (source === "TEST_RESULTS") {
            const results = JSON.parse(message);
            for (const result of results) {
              if (!result.testResult) {
                throw new Error("Tests failed!");
              }
            }
          }
        };

        // eslint-disable-next-line
        window.eval(script);

        await wait(1500);
      } else {
        console.log(`Skipping tests for challenge: ${challenge.title}`);
      }
    }
  });
});
