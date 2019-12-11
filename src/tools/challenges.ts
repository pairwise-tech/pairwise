import { CHALLENGE_TYPE } from "modules/challenges/types";

/** ===========================================================================
 * Starter Code
 * ============================================================================
 */

const DEFAULT_TYPESCRIPT_CODE = `
const addTwoNumbers = (a: number, b: number) => {
  // Edit code here
}

const result = addTwoNumbers(10, 20);
console.log(result);

// Do not edit code below this line
const main = addTwoNumbers;
`;

const DEFAULT_REACT_CODE = `
import React from "react";
import ReactDOM from "react-dom";

interface IState {
  value: string;
}

class App extends React.Component<IState> {
  constructor(props) {
    super(props);

    this.state = {
      value: "",
    };
  }

  render(): JSX.Element {
    const welcome: string = "Hello, React!";
    console.log("Hello from the iframe!!!");
    return (
      <div>
        <h1>{welcome}</h1>
        <input value={this.state.value} onChange={this.handleChange} />
      </div>
    );
  }

  handleChange = (e) => {
    this.setState({ value: e.target.value });
  }
}

// Do not edit code below this line
const Main = App;
ReactDOM.render(<Main />, document.getElementById('root'));`;

export const getDefaultChallengeStarterCode = (
  challengeType: CHALLENGE_TYPE,
) => {
  return challengeType === "react"
    ? DEFAULT_REACT_CODE
    : DEFAULT_TYPESCRIPT_CODE;
};

/** ===========================================================================
 * Test Cases
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

export type TestCase = TestCaseTypeScript | TestCaseReact;

const addDefaultTestResults = (x: any) => ({ ...x, testResult: false });

/**
 * Sample test cases for the one hard coded test.
 */
export const TEST_CASES_TYPESCRIPT: ReadonlyArray<TestCaseTypeScript> = [
  { input: [1, 2], expected: 3 },
  { input: [10, 50], expected: 60 },
  { input: [-10, -50], expected: -60 },
  { input: [100, 500], expected: 600 },
  { input: [1123, 532142], expected: 533265 },
  { input: [-10, 50], expected: 40 },
  { input: [1, 500], expected: 501 },
  { input: [842, 124], expected: 966 },
  { input: [1000, 500], expected: 1500 },
  { input: [-100, 100], expected: 0 },
  { input: [2, 50234432], expected: 50234434 },
].map(addDefaultTestResults);

/**
 * Sample test case messages for a React challenge.
 */
export const TEST_CASES_REACT: ReadonlyArray<TestCaseReact> = [
  {
    message: `Renders a <h1> tag with the text "Hello, React!"`,
  },
  {
    message: `Renders a controlled <input /> using React state`,
  },
].map(addDefaultTestResults);

export const getTestCases = (challengeType: CHALLENGE_TYPE) => {
  if (challengeType === "react") {
    return TEST_CASES_REACT;
  } else {
    return TEST_CASES_TYPESCRIPT;
  }
};

/**
 * Some sample code to run provided tests against a challenge and post
 * the messages back to the app to render.
 *
 * Regular TypeScript challenges export simple functions which can just be
 * tested with expected input/output values.
 */
export const getSampleTestCodeTypeScript = (
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
export const getSampleTestCodeMarkup = (testCases: ReadonlyArray<any>) => `
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
export const getSampleTestCodeReact = () => `
{
  let results = [];

  function fn1() {
    const container = document.createElement("div");
    ReactTestUtils.act(() => {
      ReactDOM.render(<Main />, container);
    });
    const label = container.querySelector("h1");
    return label.textContent === "Hello, React!";
  }

  function fn2() {
    const container = document.createElement("div");
    ReactTestUtils.act(() => {
      ReactDOM.render(<Main />, container);
    });
    const inputEl = container.querySelector("input");
    const testValue = "giraffe";
    ReactTestUtils.Simulate.change(inputEl, { target: { value: testValue } });
    return inputEl.value === testValue;
  }

  results.push(fn1());
  results.push(fn2());

  window.parent.postMessage({
    message: JSON.stringify(results),
    source: "TEST_RESULTS",
  });
}
`;
