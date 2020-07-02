/* eslint-disable */

/**
 * This file is meant to be run within our testing iframe.
 */

const MAX_LINE_LENGTH = 16;

// These are all defined elsewhere but they are present in the testing editor.
// @ts-ignore
declare function test(message: string, testFunction: () => void): void;
declare const __user_code_string__: string;
declare const __secret_log_box: string[];
declare const __secret_warn_box: string[];
declare const __secret_error_box: string[];
declare const __secret_info_box: string[];

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

const assert = (condition: boolean, message = "Assertion Failed") => {
  if (!condition) {
    throw new Error(message);
  }
  return true;
};

const assertEqual = (a: any, b: any) => {
  if (a !== b) {
    const typeA = typeof a;
    const typeB = typeof b;
    throw new Error(
      `[Assert] Expected ${typeA} argument ${a} to equal ${typeB} argument ${b}`,
    );
  }
  return true;
};

/**
 * A Proxy handler to "negate" the results of function calls. In this case
 * negation means throwing when the method would otherwise not have thrown,
 * since this is to be used with the expect library
 */
const methodNegationProxyHandler = {
  get: (obj: Expectation, prop: string) => {
    // We don't care about normal props. Just want to negate function call results
    // @ts-ignore
    if (typeof obj[prop] !== "function") {
      // @ts-ignore
      return obj[prop];
    }

    // Return a new function that will throw if and only if the original
    // function does not
    return (...args: any[]) => {
      try {
        // @ts-ignore
        obj[prop](...args);
      } catch (err) {
        // We expected this throw, so everything is in order
        return;
      }

      // If we get here then the original method did not through, so our .not
      // handler is actually the one that needs to throw
      throw new Error(
        `[Negation] Expected ${obj.value} NOT ${prop}(${args.join(", ")})`,
      );
    };
  },
};

type Path = Array<string | number>;

// Determine if an object has the nested key path
const hasIn = ([k, ...nextPath]: Path, obj: any): boolean => {
  if (k === undefined) {
    return true;
  } else if (obj.hasOwnProperty(k)) {
    // @ts-ignore
    return hasIn(nextPath, obj[k]);
  } else {
    return false;
  }
};

// Get the value at a nested path in an object
const getIn = (
  [k, ...nextPath]: Path,
  obj: any,
  notSetValue: any = undefined,
): any => {
  if (k === undefined) {
    return obj;
  }

  // @ts-ignore
  return getIn(nextPath, obj[k]);
};

// Just a shortcut for prettier json output
const stringify = (x: any) => JSON.stringify(x, null, 2);

const truncateMiddle = (x: string) => {
  if (typeof x !== "string") {
    return x;
  }

  const lines = x.split("\n");

  if (lines.length > MAX_LINE_LENGTH) {
    return (
      lines.slice(0, MAX_LINE_LENGTH / 2).join("\n") +
      `\n... [${lines.length - MAX_LINE_LENGTH} lines omitted] ...\n` +
      lines.slice(-(MAX_LINE_LENGTH / 2)).join("\n")
    );
  } else {
    return x;
  }
};

const isObject = (value: any) =>
  value !== null && !Array.isArray(value) && typeof value === "object";

const deepEqual = (a: any, b: any): boolean => {
  if (Array.isArray(a)) {
    return (
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((x, i) => deepEqual(x, b[i]))
    );
  } else if (isObject(a)) {
    const keys = Object.keys(a);
    return (
      isObject(b) &&
      Object.keys(b).length == keys.length &&
      keys.every(k => deepEqual(a[k], b[k]))
    );
  } else {
    return Object.is(a, b);
  }
};

const jsonDiff = (a: any, b: any): string => {
  let aStrings = stringify(a);
  let bStrings = stringify(b);
  return `Expected: ${truncateMiddle(aStrings)}\nReceived: ${truncateMiddle(
    bStrings,
  )}`;
};

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

class Expectation {
  value: any;

  not: Expectation;

  constructor(value: any) {
    this.value = value;
    this.not = new Proxy(this, methodNegationProxyHandler);
  }

  toBe(expected: any) {
    assertEqual(this.value, expected);
  }

  toEqual(expected: any) {
    assert(
      deepEqual(this.value, expected),
      "[Assert] Expected deep equality but got:\n" +
        jsonDiff(this.value, expected),
    );
  }

  toBeGreaterThan(n: number) {
    assert(this.value > n, `[Assert] Expected ${this.value} > ${n} (GT)`);
  }

  toBeGreaterThanOrEqual(n: number) {
    assert(this.value >= n, `[Assert] Expected ${this.value} >= ${n} (GTE)`);
  }

  toBeLessThan(n: number) {
    assert(this.value < n, `[Assert] Expected ${this.value} < ${n} (LT)`);
  }

  toBeLessThanOrEqual(n: number) {
    assert(this.value <= n, `[Assert] Expected ${this.value} <= ${n} (LTE)`);
  }

  toMatch(strOrReg: string | RegExp) {
    let matched = false;
    if (typeof this.value !== "string") {
      assert(
        false,
        "[Assert] toMatch cannot match a non-string value:" + this.value,
      );
      return;
    } else if (typeof strOrReg === "string") {
      matched = this.value.includes(strOrReg);
    } else if (strOrReg.constructor === RegExp) {
      matched = strOrReg.test(this.value);
    } else {
      assert(
        false,
        "[Assert] toMatch passed invalid value. Use a string or a RegExp",
      );
    }

    assert(
      matched,
      `[Assert] Expected "${truncateMiddle(this.value)}" to match ${strOrReg}`,
    );
  }

  toHaveProperty(keyPath: Path | string, optionalTestValue?: any) {
    if (typeof keyPath === "string") {
      keyPath = keyPath.split(".");
    }
    const hasProperty = hasIn(keyPath, this.value);
    if (optionalTestValue) {
      assert(
        hasProperty && deepEqual(getIn(keyPath, this.value), optionalTestValue),
        `[Assert] Expected to have property ${keyPath.join(".")}`,
      );
    } else {
      assert(
        hasProperty,
        `[Assert] Expected at path ${keyPath.join(".")}:\n${truncateMiddle(
          stringify(optionalTestValue),
        )}\nReceived: ${truncateMiddle(stringify(this.value))}`,
      );
    }
  }

  toBeTruthy() {
    assertEqual(Boolean(this.value), true);
  }

  toBeFalsy() {
    assertEqual(Boolean(this.value), false);
  }

  // Note: See Jest source code. I'm not sure why they divide by 2.
  // https://github.com/facebook/jest/blob/2a92e7f49fa35b219e5099d56b0179bccc1bf53e/packages/expect/src/matchers.ts#L170
  toBeCloseTo(expected: number, precision: number = 2) {
    const received = this.value;

    if (typeof expected !== "number") {
      assert(
        false,
        `[Assert] toBeCloseTo passed invalid value. Needs a number but got: ${expected}`,
      );
      return;
    }

    if (typeof expected !== "number") {
      assert(
        false,
        `[Assert] toBeCloseTo called but expectation contained invalid value. ${received}`,
      );
      return;
    }

    let pass = false;
    let expectedDiff = 0;
    let receivedDiff = 0;

    if (received === Infinity && expected === Infinity) {
      pass = true; // Infinity - Infinity is NaN
    } else if (received === -Infinity && expected === -Infinity) {
      pass = true; // -Infinity - -Infinity is NaN
    } else {
      expectedDiff = Math.pow(10, -precision) / 2; // See NOTE
      receivedDiff = Math.abs(expected - received);
      pass = receivedDiff < expectedDiff;
    }

    assert(
      pass,
      `[Assert] toBeCloseTo expected ${expected} to differ from ${received} by less than ${expectedDiff}. Actual diff was ${receivedDiff}`,
    );
  }

  toBeDefined() {
    assertEqual(typeof this.value !== "undefined", true);
  }

  toContain(val: any) {
    const isValid = Array.isArray(this.value) || typeof this.value === "string";
    assert(
      isValid,
      `[Assert] toContain used on invalid value ${stringify(this.value)}`,
    );
    assert(
      this.value.includes(val),
      `${val} not found in ${stringify(this.value)}`,
    );
  }

  toThrow(optionalFailureMessage?: string) {
    let didThrow = false;
    let errorMessage;

    try {
      // The function to test should be supplied in the initialization of
      // expect, e.g. expect(() => throw new Error("boom")).toThrow();
      this.value();
    } catch (err) {
      didThrow = true;
      errorMessage = err.message;
    }

    const defaultMessage = `[Assert] Expected code/function to not throw, but received this error message: ${errorMessage}`;
    const message = optionalFailureMessage || defaultMessage;

    assert(didThrow, message);
  }
}

// @ts-ignore
const expect = x => new Expectation(x);

/* Expose Globals */
// @ts-ignore
window.get = get;
// @ts-ignore
window.getAll = getAll;
// @ts-ignore
window.getStyle = getStyle;
// @ts-ignore
window.getText = getText;
// @ts-ignore
window.assert = assert;
// @ts-ignore
window.assertEqual = assertEqual;
// @ts-ignore
window.expect = expect;
