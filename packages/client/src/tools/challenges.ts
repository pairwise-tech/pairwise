// Import Workers:
// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import CodeFormatWorker from "workerize-loader!./prettier-code-formatter";
// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import EXPECTATION_LIB from "raw-loader!./in-browser-testing-lib";

import { CHALLENGE_TYPE } from "@pairwise/common";

/** ===========================================================================
 * Types
 * ============================================================================
 */

export interface TestCase {
  test: string;
  message: string;
  testResult: boolean;
  error?: string;
}

export enum IFRAME_MESSAGE_TYPES {
  LOG = "LOG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  TEST_RESULTS = "TEST_RESULTS",
  TEST_ERROR = "TEST_ERROR",
}

export interface IframeMessageEvent extends MessageEvent {
  data: {
    message: string;
    source: IFRAME_MESSAGE_TYPES;
  };
}

export interface CodeFormatMessage {
  code: string;
  type: CHALLENGE_TYPE;
  channel: string;
}

export interface CodeFormatMessageEvent extends MessageEvent {
  data: CodeFormatMessage;
}

// NOTE: Instatiating the worker right here at the top level feels off. Could
// potentially cause build issues if we get too tricky with our build, but for
// now this should be fine
const codeWorker = new CodeFormatWorker();

export const requestCodeFormatting = (message: CodeFormatMessage) => {
  codeWorker.postMessage(message);
};

export const subscribeCodeWorker = (fn: (e: CodeFormatMessageEvent) => any) => {
  codeWorker.addEventListener("message", fn);
};

export const unsubscribeCodeWorker = (
  fn: (e: CodeFormatMessageEvent) => any,
) => {
  codeWorker.removeEventListener("message", fn);
};

/** ===========================================================================
 * Challenge Utils
 * ============================================================================
 */

/**
 * Uses the browsers own internal engine to clean up HTML. The reason to do this
 * is to standardize HTML output from the user before work work with it
 * internally
 */
export const tidyHtml = (html: string) => {
  const el = document.createElement("html");
  el.innerHTML = html;
  return el.innerHTML;
};

/**
 * This is just exported as a function for consistency and in case we need to
 * augment it later;
 */
export const getTestDependencies = (): string => EXPECTATION_LIB;

/**
 * Get the test code string for a markup challenge.
 */
export const getTestHarness = (testCode: string): string => `
function buildTestsFromCode() {
    const arr = [];
    const test = (message, fn) => {
        arr.push({
            message,
            test: fn,
        })
    }

    ${testCode}

    return arr;
}

function runTests() {
  const tests = buildTestsFromCode()

  const results = tests.reduce((agg, { message, test }) => {
    try {
      const _result = test();
      // Tests that pass using expect will return undefined, since they don't return anything.
      // TODO: At some point we will want to account for async tests, which will require
      // changes here
      const testResult = _result === undefined ? true : _result;
      return agg.concat([{
        message,
        testResult: testResult,
        error: null,
      }])
    } catch (err) {
      return agg.concat([{
        message,
        testResult: false,
        error: err.message + '\\n\\n' + err.stack,
      }])
    }
  }, []);

  return results;
}

try {
  const results = runTests();
  window.parent.postMessage({
    message: JSON.stringify(results),
    source: "${IFRAME_MESSAGE_TYPES.TEST_RESULTS}",
  });
} catch (err) {
  window.parent.postMessage({
    message: JSON.stringify({
      error: err.message,
    }),
    source: "${IFRAME_MESSAGE_TYPES.TEST_ERROR}",
  });
}
`;

/**
 * Put together the script tags necessary for running the tests in an iframe,
 * including the script that includes the tests themselves.
 */
export const getTestScripts = (testCode: string) => {
  return `
    <script id="test-dependencies">${getTestDependencies()}</script>
    <script id="test-code">${getTestHarness(testCode)}</script>
  `;
};
