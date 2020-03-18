/* eslint-disable */

/**
 * This file is meant to be run within our testing iframe, and is thus simple JS.
 * For now this file is indeed meant to be JS (not TS) since it's not run
 * through any compilation pipeline.
 *
 * .js life!!!
 */

const MAX_LINE_LENGTH = 16;

/**
 * A shortcut for document.querySelector
 * @param {string} selector CSS Selector
 */
const get = selector => document.querySelector(selector);

/**
 * A shortcut for getting an array of all elements that match the selector
 * @param {string} selector CSS Selector
 */
const getAll = selector => {
  return Array.prototype.slice.call(document.querySelectorAll(selector));
};

/**
 * A wrapper around window.getComputedStyle
 *
 * @param {Element} el DOM Element
 * @param {string} cssProp CSS property name. I.e. "background-color"
 */
const getStyle = (el, cssProp, pseudoSelector = null) => {
  const view =
    el.ownerDocument && el.ownerDocument.defaultView
      ? el.ownerDocument.defaultView
      : window;
  const style = view.getComputedStyle(el, pseudoSelector);
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
const getText = selector => {
  const element = get(selector);
  const html = element.innerHTML;
  return html;
};

const css = (propName, value) => {
  let dummy = get("#dummy-test-div");

  // Create the dummy div if not present
  if (!dummy) {
    dummy = document.createElement("div");
    dummy.id = "dummy-test-div";
    dummy.style.display = "none";
    document.body.appendChild(dummy);
  }

  // Grab the initial style so that we can reset later
  const initial = dummy.style[propName];

  // Set the new style and get the style as computed by the browser
  dummy.style[propName] = value;
  const result = getStyle(dummy, propName);

  // Reset to the initial value on the dummy el
  dummy.style[propName] = initial;

  return result;
};

const cssColor = value => css("color", value);

const assert = (condition, message = "Assertion Failed") => {
  if (!condition) {
    throw new Error(message);
  }
  return true;
};

const assertEqual = (a, b) => {
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
  get: (obj, prop) => {
    // We don't care about normal props. Just want to negate function call results
    if (typeof obj[prop] !== "function") {
      return obj[prop];
    }

    // Return a new function that will throw if and only if the original
    // function does not
    return (...args) => {
      try {
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

const truncateMiddle = x => {
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

const isObject = value =>
  value !== null && !Array.isArray(value) && typeof value === "object";

const deepEqual = (a, b) => {
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

const jsonDiff = (a, b) => {
  let aStrings = JSON.stringify(a, null, 2);
  let bStrings = JSON.stringify(b, null, 2);
  return `Expected: ${truncateMiddle(aStrings)}\nReceived: ${truncateMiddle(
    bStrings,
  )}`;
};

class Expectation {
  constructor(value) {
    this.value = value;
    this.not = new Proxy(this, methodNegationProxyHandler);
  }

  toBe(expected) {
    assertEqual(this.value, expected);
  }
  toEqual(expected) {
    assert(
      deepEqual(this.value, expected),
      "[Assert] Expected deep equality but got:\n" +
        jsonDiff(this.value, expected),
    );
  }
  toBeGreaterThan(number) {
    assert(
      this.value > number,
      `[Assert] Expected ${this.value} > ${number} (GT)`,
    );
  }
  toBeGreaterThanOrEqual(number) {
    assert(
      this.value >= number,
      `[Assert] Expected ${this.value} >= ${number} (GTE)`,
    );
  }
  toBeLessThan(number) {
    assert(
      this.value < number,
      `[Assert] Expected ${this.value} < ${number} (LT)`,
    );
  }
  toBeLessThanOrEqual(number) {
    assert(
      this.value <= number,
      `[Assert] Expected ${this.value} <= ${number} (LTE)`,
    );
  }
  toMatch(strOrReg) {
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
  toBeTruthy() {
    assertEqual(Boolean(this.value), true);
  }
  toBeFalsy() {
    assertEqual(!Boolean(this.value), false);
  }
  toBeDefined() {
    assertEqual(typeof this.value !== undefined, true);
  }
  toContain(val) {
    assert(this.value.includes(val), `${val} not found in ${arr.join(",")}`);
  }
}

const expect = x => new Expectation(x);

/* Expose Globals */
window.get = get;
window.getAll = getAll;
window.getStyle = getStyle;
window.getText = getText;
window.assert = assert;
window.assertEqual = assertEqual;
window.expect = expect;
