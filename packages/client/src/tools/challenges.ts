// Import Workers:
// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import CodeFormatWorker from "workerize-loader!./prettier-code-formatter";

import { CHALLENGE_TYPE } from "@pairwise/common";

/** ===========================================================================
 * Types
 * ============================================================================
 */

export interface TestCaseReact {
  message: string;
  test: string;
  testResult: boolean;
}

export interface TestCaseMarkupTypescript {
  test: string;
  message: string;
  testResult: boolean;
}

export type TestCase = TestCaseReact | TestCaseMarkupTypescript;

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
 * Just a simpler (and more declarative) way to create dom elements. We need
 * this for modifying the iframe
 */
export const makeElementFactory = (
  createElement: typeof document.createElement,
) => {
  return (tag: string, props: { [k: string]: string }) => {
    const el = createElement(tag);
    Object.keys(props).forEach(k => {
      const v = props[k];
      // @ts-ignore
      el[k] = v;
    });
    return el;
  };
};

export const waitForDom = (
  doc: typeof window.document,
  timeout: number = 10000,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new Error(`[DOM Timeout] Waited ${timeout}ms without DOM loaded event`),
      );
    }, timeout);

    const listener = () => {
      // Remove self before resolving
      clearTimeout(timer);
      doc.removeEventListener("DOMContentLoaded", listener);
      resolve();
    };

    doc.addEventListener("DOMContentLoaded", listener);
  });
};

export const waitForObjectProp = (
  obj: { [k: string]: any },
  prop: string,
  timeout: number = 10000,
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      clearInterval(interval);
      reject(
        new Error(`[DOM Timeout] Waited ${timeout}ms without DOM loaded event`),
      );
    }, timeout);

    const poll = () => {
      if (obj[prop] !== undefined) {
        clearTimeout(timer);
        clearInterval(interval);
        resolve(obj[prop]);
      } else {
        console.warn("polling...");
      }
    };

    const interval = setInterval(poll, 60);
  });
};

/**
 * Get the test code string for a markup challenge.
 */
export const getTestHarness = (testCode: string): string => `
window.get = (...args) => document.querySelector(...args);
window.getAll = (...args) => {
  return Array.prototype.slice.call(document.querySelectorAll(...args));
}
window.getStyle = (el, cssProp) => {
  const view = (el.ownerDocument && el.ownerDocument.defaultView) ? el.ownerDocument.defaultView : window;
  const style = view.getComputedStyle(el);
  return style.getPropertyValue(cssProp) || style[cssProp];
}
window.assert = (condition, message = 'Assertion Failed') => {
  if (!condition) {
    throw new Error(message);
  }
  return true;
}
window.assertEqual = (a, b) => {
  if (a !== b) {
    const typeA = typeof a;
    const typeB = typeof b;
    throw new Error(\`[Assert] Expected \${typeA} argument \${a} to equal \${typeB} argument \${b}\`);
  }
  return true;
}
window.expect = (actual) => ({
  toBe: (expected) => assertEqual(actual, expected),
  toBeTruthy: () => assertEqual(Boolean(actual), true),
  toBeFalsy: () => assertEqual(!Boolean(actual), false),
  toContain: (val) => {
    assert(actual.includes(val), \`\${val} not found in \${arr.join(',')}\`)
  },
})

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
