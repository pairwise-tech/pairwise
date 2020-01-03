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
export const getTestCodeMarkup = (testCases: ReadonlyArray<any>) => `
let results = [];

window.$ = (...args) => document.querySelector(...args);
window.$$ = (...args) => Array.prototype.slice.call(document.querySelectorAll(...args));
window.getStyle = (el, cssProp) => {
  const view = (el.ownerDocument && el.ownerDocument.defaultView) ? el.ownerDocument.defaultView : window;
  const style = view.getComputedStyle(el);
  return style.getPropertyValue(cssProp) || style[cssProp];
}

for (const x of ${JSON.stringify(testCases)}) {
  const { test } = x;
  try {
    results.push(eval(test));
  } catch (err) {
    results.push(false);
  }
}

window.parent.postMessage({
  message: JSON.stringify(results),
  source: "TEST_RESULTS",
});
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
