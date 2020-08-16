/**
 * The alternative name is to avoid name collisions with our own Jest named
 * test functions (above declaration). It may be better to have the user
 * also write Jest style test functions. We can revisit and get that to work
 * later.
 */
// @ts-ignore
declare function it(message: string, testFunction: () => void): void;

type Path = Array<string | number>;

class Expectation {
  value: any;

  not: Expectation;

  MAX_LINE_LENGTH = 16;

  constructor(value: any) {
    this.value = value;
    this.not = new Proxy(this, this.methodNegationProxyHandler);
  }

  toBe(expected: any) {
    this.assertEqual(this.value, expected);
  }

  toEqual(expected: any) {
    this.assert(
      this.deepEqual(this.value, expected),
      "[Assert] Expected deep equality but got:\n" +
        this.jsonDiff(this.value, expected),
    );
  }

  toBeGreaterThan(n: number) {
    this.assert(this.value > n, `[Assert] Expected ${this.value} > ${n} (GT)`);
  }

  toBeGreaterThanOrEqual(n: number) {
    this.assert(
      this.value >= n,
      `[Assert] Expected ${this.value} >= ${n} (GTE)`,
    );
  }

  toBeLessThan(n: number) {
    this.assert(this.value < n, `[Assert] Expected ${this.value} < ${n} (LT)`);
  }

  toBeLessThanOrEqual(n: number) {
    this.assert(
      this.value <= n,
      `[Assert] Expected ${this.value} <= ${n} (LTE)`,
    );
  }

  toMatch(strOrReg: string | RegExp) {
    let matched = false;
    if (typeof this.value !== "string") {
      this.assert(
        false,
        "[Assert] toMatch cannot match a non-string value:" + this.value,
      );
      return;
    } else if (typeof strOrReg === "string") {
      matched = this.value.includes(strOrReg);
    } else if (strOrReg.constructor === RegExp) {
      matched = strOrReg.test(this.value);
    } else {
      this.assert(
        false,
        "[Assert] toMatch passed invalid value. Use a string or a RegExp",
      );
    }

    this.assert(
      matched,
      `[Assert] Expected "${this.truncateMiddle(
        this.value,
      )}" to match ${strOrReg}`,
    );
  }

  toHaveProperty(keyPath: Path | string, optionalTestValue?: any) {
    if (typeof keyPath === "string") {
      keyPath = keyPath.split(".");
    }
    const hasProperty = this.hasIn(keyPath, this.value);
    if (optionalTestValue) {
      this.assert(
        hasProperty &&
          this.deepEqual(this.getIn(keyPath, this.value), optionalTestValue),
        `[Assert] Expected to have property ${keyPath.join(".")}`,
      );
    } else {
      this.assert(
        hasProperty,
        `[Assert] Expected at path ${keyPath.join(".")}:\n${this.truncateMiddle(
          this.stringify(optionalTestValue),
        )}\nReceived: ${this.truncateMiddle(this.stringify(this.value))}`,
      );
    }
  }

  toBeTruthy() {
    this.assertEqual(Boolean(this.value), true);
  }

  toBeFalsy() {
    this.assertEqual(Boolean(this.value), false);
  }

  // Note: See Jest source code. I'm not sure why they divide by 2.
  // https://github.com/facebook/jest/blob/2a92e7f49fa35b219e5099d56b0179bccc1bf53e/packages/expect/src/matchers.ts#L170
  toBeCloseTo(expected: number, precision: number = 2) {
    const received = this.value;

    if (typeof expected !== "number") {
      this.assert(
        false,
        `[Assert] toBeCloseTo passed invalid value. Needs a number but got: ${expected}`,
      );
      return;
    }

    if (typeof expected !== "number") {
      this.assert(
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

    this.assert(
      pass,
      `[Assert] toBeCloseTo expected ${expected} to differ from ${received} by less than ${expectedDiff}. Actual diff was ${receivedDiff}`,
    );
  }

  toBeDefined() {
    this.assertEqual(typeof this.value !== "undefined", true);
  }

  toContain(val: any) {
    const isValid = Array.isArray(this.value) || typeof this.value === "string";
    this.assert(
      isValid,
      `[Assert] toContain used on invalid value ${this.stringify(this.value)}`,
    );
    this.assert(
      this.value.includes(val),
      `${val} not found in ${this.stringify(this.value)}`,
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

    this.assert(didThrow, message);
  }

  private assert = (condition: boolean, message = "Assertion Failed") => {
    if (!condition) {
      throw new Error(message);
    }
    return true;
  };

  private assertEqual = (a: any, b: any) => {
    if (a !== b) {
      const typeA = typeof a;
      const typeB = typeof b;
      throw new Error(
        `[Assert] Expected ${typeA} argument ${a} to equal ${typeB} argument ${b}`,
      );
    }
    return true;
  };

  private deepEqual = (a: any, b: any): boolean => {
    if (Array.isArray(a)) {
      return (
        Array.isArray(b) &&
        a.length === b.length &&
        a.every((x, i) => this.deepEqual(x, b[i]))
      );
    } else if (this.isObject(a)) {
      const keys = Object.keys(a);
      return (
        this.isObject(b) &&
        Object.keys(b).length === keys.length &&
        keys.every(k => this.deepEqual(a[k], b[k]))
      );
    } else {
      return Object.is(a, b);
    }
  };

  private jsonDiff = (a: any, b: any): string => {
    let aStrings = this.stringify(a);
    let bStrings = this.stringify(b);
    return `Expected: ${this.truncateMiddle(
      aStrings,
    )}\nReceived: ${this.truncateMiddle(bStrings)}`;
  };

  // Just a shortcut for prettier json output
  private stringify = (x: any) => JSON.stringify(x, null, 2);

  private truncateMiddle = (x: string) => {
    if (typeof x !== "string") {
      return x;
    }

    const lines = x.split("\n");

    if (lines.length > this.MAX_LINE_LENGTH) {
      return (
        lines.slice(0, this.MAX_LINE_LENGTH / 2).join("\n") +
        `\n... [${lines.length - this.MAX_LINE_LENGTH} lines omitted] ...\n` +
        lines.slice(-(this.MAX_LINE_LENGTH / 2)).join("\n")
      );
    } else {
      return x;
    }
  };

  private isObject = (value: any) => {
    return value !== null && !Array.isArray(value) && typeof value === "object";
  };

  // Determine if an object has the nested key path
  private hasIn = ([k, ...nextPath]: Path, obj: any): boolean => {
    if (k === undefined) {
      return true;
    } else if (obj.hasOwnProperty(k)) {
      // @ts-ignore
      return hasIn(nextPath, obj[k]);
    } else {
      return false;
    }
  };

  /**
   * A Proxy handler to "negate" the results of function calls. In this case
   * negation means throwing when the method would otherwise not have thrown,
   * since this is to be used with the expect library
   */
  methodNegationProxyHandler = {
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

  // Get the value at a nested path in an object
  private getIn = (
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
}

// @ts-ignore
const expect = x => new Expectation(x);

// @ts-ignore
window.expect = expect;
// @ts-ignore
window.assert = assert;
// @ts-ignore
window.assertEqual = assertEqual;
