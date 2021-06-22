/* eslint-disable */

/** ===========================================================================
 * This file provides additional test utils and type definitions for
 * our Workspace test environment.
 * ============================================================================
 */

/** ===========================================================================
 * Type definitions for additional test utils which are provided in the
 * test-utils file, e.g. see TEST_UTILS_GLOBALS.
 * ============================================================================
 */
declare const __user_code_string__: string;
declare const __secret_log_box: string[];
declare const __secret_warn_box: string[];
declare const __secret_error_box: string[];
declare const __secret_info_box: string[];

interface TestCase {
  message: string;
  test: (...args: any) => void;
}

// Special list of user tests for the testing and automation module challenges
declare const __USER_TEST_LIST__: TestCase[];

/** ===========================================================================
 * Global test helpers.
 * ============================================================================
 */

/**
 * A shortcut for document.querySelector
 * @param {string} selector CSS Selector
 */
const get = (selector: string) => document.querySelector<HTMLElement>(selector);

/**
 * A shortcut for getting an array of all elements that match the selector
 * @param {string} selector CSS Selector
 */
const getAll = (selector: string) => {
  return Array.prototype.slice.call(document.querySelectorAll(selector));
};

/**
 * A wrapper around window.getComputedStyle
 *
 * @param {Element} el DOM Element
 * @param {string} cssProp CSS property name. I.e. "background-color"
 */
const getStyle = (
  el: HTMLElement,
  cssProp: string,
  pseudoSelector: string | null = null,
): string => {
  const view =
    el.ownerDocument && el.ownerDocument.defaultView
      ? el.ownerDocument.defaultView
      : window;
  const style = view.getComputedStyle(el, pseudoSelector);

  // @ts-ignore
  return style.getPropertyValue(cssProp) || style[cssProp];
};

/**
 * Get the innerHTML from an element given an HTML selector.
 *
 * NOTE: This is called getText so it's more clear it is the method to use
 * for getting and performing assertions on text content of HTML elements.
 * That is because using .innerText will break in our unit test environment,
 * so we don't want to use it. Naming this method getText should more strongly
 * suggest to use this when performing text assertions.
 *
 * NOTE: This approach is advisable to be used to get text for HTML elements
 * because it will work in both the app and unit testing environment.
 */
const getText = (selector: string) => {
  try {
    const element = get(selector);
    // @ts-ignore
    const html = element.innerHTML;
    return html.trim();
  } catch (err) {
    throw err; // Just rethrow
  }
};

type Maybe<T> = T | null;

const css = (propName: string, value: string | number) => {
  let dummy: Maybe<HTMLElement> = get("#dummy-test-div");

  // Create the dummy div if not present
  if (!dummy) {
    dummy = document.createElement("div");
    dummy.id = "dummy-test-div";
    dummy.style.display = "none";
    document.body.appendChild(dummy);
  }

  // Grab the initial style so that we can reset later
  // @ts-ignore
  const initial = dummy.style[propName];

  // Set the new style and get the style as computed by the browser
  // @ts-ignore
  dummy.style[propName] = value;
  const result = getStyle(dummy, propName);

  // Reset to the initial value on the dummy el
  // @ts-ignore
  dummy.style[propName] = initial;

  return result;
};

const cssColor = (value: string) => css("color", value);

// Helper to parse the boxes of console messages and convert them
// to objects and extract the messages to help with writing test
// assertions.
const parseLogBox = (box: string[]): string[] => {
  const parsedBoxLogs = box.map(x => JSON.parse(x));
  const messageBox = parsedBoxLogs.map(x => x[0]);
  return messageBox;
};

// Given a box of logged console messages (see above function) and
// a message, return if the box contains that message exactly.
const inBox = (box: string[], message: string): boolean => {
  const result = box.find(m => m === message);
  return !!result;
};

// Check for a message in the console log box, but after some delay.
// This is a helper for running tests in async challenges, where a challenge
// may need to log a message but after waiting for some time.
const checkBoxAsync = async (
  box: string[],
  message: string,
  delay: number,
): Promise<boolean> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const result = inBox(box, message);
      resolve(result);
    }, delay);
  });
};

// Wait some time... useful for pausing to let async challenges have some
// time to complete some actions.
const wait = async (time: number) => {
  return new Promise(resolve => setTimeout(resolve, time));
};

// Helper to quickly fail a test.
// @ts-ignore
const fail = () => expect(false).toBe(true);

// Helper to quickly pass a test.
const pass = () => expect(true).toBe(true);

// Generate a random string id
const __id = () => {
  return (
    Math.random()
      .toString(36)
      .substring(2) + Date.now().toString(36)
  );
};

// Generate a random number in a min...max range
const __randomInRange = (min, max) => {
  return Math.round(Math.random() * (max - min) + min);
};

/** ===========================================================================
 * Database Challenge API Helpers
 * ----------------------------------------------------------------------------
 * These utils rely on the database-challenge-api which executes database
 * queries against a database and returns results to be checked with
 * assertions in the test environment.
 *
 * Reference: https://github.com/pairwise-tech/database-challenge-api
 * ============================================================================
 */

/**
 * Mock a MongoClient API to help test MongoDB challenges. This approach
 * feels workable for a first version. Alternatively, we may need/want
 * to just arbitrarily execute NodeJS code, which may come with the backend
 * challenges anyway.
 */
class MockMongoCollection {
  private args: any = null;

  private getArgs() {
    return this.args;
  }

  public async insertOne(args: any): Promise<any> {
    this.args = args;
  }
}

const usersCollection = new MockMongoCollection();

/**
 * Switch the database URL if you need to test and run the Database Challenge
 * API server locally:
 *
 * TODO: It might be nice if this DATABASE_CHALLENGE_API was an environment
 * variable, but this is a little tricky because these files are built
 * independently and then just included directly as JS in runtime.
 */

// const DATABASE_CHALLENGE_API = "http://localhost:5000";
const DATABASE_CHALLENGE_API =
  "https://database-challenge-api.uc.r.appspot.com";

/**
 * Helper for SQL code challenges.
 */
const executePostgresQuery = async (
  preSqlQuery: string,
  userSqlQuery: string,
  postSqlQuery: string,
) => {
  try {
    const url = `${DATABASE_CHALLENGE_API}/postgres/query`;
    const userQuery = userSqlQuery;
    const preQuery = preSqlQuery || "";
    const postQuery = postSqlQuery || "";
    const body = JSON.stringify({ userQuery, preQuery, postQuery });
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    const response = await fetch(url, {
      body,
      headers,
      method: "post",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text);
    }

    const result = await response.json();
    return result;
  } catch (err) {
    // Throw err to fail test
    throw err;
  }
};

/**
 * Helper for MongoDB code challenges.
 */
const executeMongoDBQuery = async args => {
  try {
    const url = `${DATABASE_CHALLENGE_API}/mongodb/query`;
    const body = JSON.stringify({ args });
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    const response = await fetch(url, {
      body,
      headers,
      method: "post",
    });
    const result = await response.json();
    return result;
  } catch (err) {
    // Throw err to fail test
    throw err;
  }
};

const PAIRWISE_CODE_RUNNER_API = "http://localhost:6001";
// const PAIRWISE_CODE_RUNNER_API = "";

interface AlternateLanguageTestResult {
  stdout: string;
  stderr: string;
  testResult: string;
}

/**
 * Process a test result from a Rust test.
 */
const handleAlternateLanguageTestResult = (
  result: AlternateLanguageTestResult,
  log: (message: string) => void,
) => {
  const { stdout, stderr, testResult } = result;
  const isValid = testResult === "true";
  if (isValid) {
    if (stdout !== "") {
      log(stdout);
    }
    pass();
  } else {
    log(stderr);
    fail();
  }
};

/**
 * Execute Rust code.
 */
const executeRustChallengeTests = async (
  codeString: string,
  testString: string,
): Promise<AlternateLanguageTestResult> => {
  try {
    const url = `${PAIRWISE_CODE_RUNNER_API}/api/rust`;
    const body = JSON.stringify({ codeString, testString });
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    const response = await fetch(url, {
      body,
      headers,
      method: "post",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text);
    }

    const result = await response.json();
    return result;
  } catch (err) {
    // Throw err to fail test
    throw err;
  }
};

/**
 * Execute Python code.
 */
const executePythonChallengeTests = async (
  codeString: string,
  testString: string,
): Promise<AlternateLanguageTestResult> => {
  try {
    const url = `${PAIRWISE_CODE_RUNNER_API}/api/python`;
    const body = JSON.stringify({ codeString, testString });
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    const response = await fetch(url, {
      body,
      headers,
      method: "post",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text);
    }

    const result = await response.json();
    return result;
  } catch (err) {
    // Throw err to fail test
    throw err;
  }
};

/**
 * Execute Python code.
 */
const executeGolangChallengeTests = async (
  codeString: string,
  testString: string,
): Promise<AlternateLanguageTestResult> => {
  try {
    const url = `${PAIRWISE_CODE_RUNNER_API}/api/golang`;
    const body = JSON.stringify({ codeString, testString });
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    const response = await fetch(url, {
      body,
      headers,
      method: "post",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text);
    }

    const result = await response.json();
    return result;
  } catch (err) {
    // Throw err to fail test
    throw err;
  }
};

/** ===========================================================================
 * React Native Web Test Helpers
 * ============================================================================
 */

// Determine if a text element exists with the given text for a
// React Native challenge.
const reactNativeTextExists = (text: string) => {
  // Text components are rendered as divs:
  const containers = document.getElementsByTagName("div");

  // @ts-ignore
  for (const div of containers) {
    if (div.innerHTML === text) {
      return true;
    }
  }

  return false;
};

// Determine if a button element exists with the given text for a
// React Native challenge.
const reactNativeButtonWithTextExists = (text: string) => {
  // Buttons are rendered as divs with a button role:
  const buttons = document.querySelectorAll('[role="button"]');

  // @ts-ignore
  for (const button of buttons) {
    // @ts-ignore
    if (button.firstChild.innerHTML === text) {
      return true;
    }
  }

  return false;
};

/** ===========================================================================
 * Expose Globals
 * ============================================================================
 */

// @ts-ignore
window.get = get;
// @ts-ignore
window.getAll = getAll;
// @ts-ignore
window.getStyle = getStyle;
// @ts-ignore
window.getText = getText;
// @ts-ignore
window.reactNativeTextExists = reactNativeTextExists;
// @ts-ignore
window.reactNativeButtonWithTextExists = reactNativeButtonWithTextExists;
