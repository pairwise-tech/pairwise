/** ===========================================================================
 * Types
 * ============================================================================
 */

export interface TestCaseReact {
  message: string;
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
 *
 * NOTE: The test case involves writing functions inline which will then
 * execute directly against the user's code which will be provided in scope
 * above.
 *
 * Presumably, these functions can be provided using the Workspace CMS™
 * which will provide an easier way to create and edit these test cases and
 * then behind the scenes write the tests as strings to some file, which could
 * then be read like the test cases below:
 */
export const getTestCodeReact = () => `
{
  const results = [
    (function() {
      try {
        const container = document.createElement("div");
        ReactTestUtils.act(() => {
          ReactDOM.render(<Main />, container);
        });
        const label = container.querySelector("h1");
        return label.textContent === "Hello, React!";
      } catch (err) {
        return false;
      }
    })(),
    (function() {
      try {
        const container = document.createElement("div");
        ReactTestUtils.act(() => {
          ReactDOM.render(<Main />, container);
        });
        const inputEl = container.querySelector("input");
        const testValue = "giraffe";
        ReactTestUtils.Simulate.change(inputEl, { target: { value: testValue } });
        return inputEl.value === testValue;
      } catch (err) {
        return false;
      }
    })(),
  ];

  window.parent.postMessage({
    message: JSON.stringify(results),
    source: "TEST_RESULTS",
  });
}
`;
