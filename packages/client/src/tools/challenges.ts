// Import Workers:
// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import CodeFormatWorker from "workerize-loader!./prettier-code-formatter";

import { CHALLENGE_TYPE } from "@prototype/common";

/** ===========================================================================
 * Types
 * ============================================================================
 */

export interface TestCaseReact {
  message: string;
  test: string;
  testResult: boolean;
}

export interface TestCaseTypeScript {
  input: any;
  expected: any;
  testResult: boolean;
}

export interface TestCaseMarkup {
  test: string;
  message: string;
  testResult: boolean;
}

export type TestCase = TestCaseTypeScript | TestCaseReact | TestCaseMarkup;

export enum IFRAME_MESSAGE_TYPES {
  LOG = "LOG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  TEST_RESULTS = "TEST_RESULTS",
  TEST_ERROR = "TEST_RESULTS",
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
 * Some sample code to run provided tests against a challenge and post
 * the messages back to the app to render.
 *
 * Regular TypeScript challenges export simple functions which can just be
 * tested with expected input/output values.
 */
export const getTestCodeTypeScript = (
  testCases: ReadonlyArray<TestCaseTypeScript>,
) => `
let results = [];

for (const x of ${JSON.stringify(testCases)}) {
  const { input, expected } = x;
  results.push(main(...input) === expected);
}

window.parent.postMessage({
  message: JSON.stringify(results),
  source: "TEST_RESULTS",
});
`;

/**
 * Get the test code string for a markup challenge.
 */
export const getTestCodeMarkup = (testCode: string): string => `
window.$ = (...args) => document.querySelector(...args);
window.$$ = (...args) => Array.prototype.slice.call(document.querySelectorAll(...args));
window.getStyle = (el, cssProp) => {
  const view = (el.ownerDocument && el.ownerDocument.defaultView) ? el.ownerDocument.defaultView : window;
  const style = view.getComputedStyle(el);
  return style.getPropertyValue(cssProp) || style[cssProp];
}

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
      return agg.concat([{
        message,
        testResult: test(),
        error: null,
      }])
    } catch (err) {
      return agg.concat([{
        message,
        testResult: false,
        error: err.message,
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
 * Some sample code to run provided tests against a challenge and post
 * the messages back to the app to render.
 *
 * This is currently using the React test-utils package for testing,
 * ref: https://reactjs.org/docs/test-utils.html.
 */
export const getTestCodeReact = (testCases: ReadonlyArray<TestCaseReact>) => {
  const codeString = testCases.map(t => t.test).join(", ");

  return `
  {
    const results = [${codeString}];

    window.parent.postMessage({
      message: JSON.stringify(results),
      source: "TEST_RESULTS",
    });
  }
  `;
};
