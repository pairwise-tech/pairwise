/** ===========================================================================
 * This file defines the Jest-like expectation library which is used in
 * the Workspace tests and provided to the Workspace testing challenges
 * for users. These library mimics the Jest library (and the
 * method comments are generally adapted from the @types/jest file).
 *
 * Because this is also user-facing, it is separated from the other
 * browser-test-utils.
 * ============================================================================
 */
// @ts-ignore
var test = function (message, fn) { return undefined; };
var Expectation = /** @class */ (function () {
    function Expectation(value) {
        var _this = this;
        this.MAX_LINE_LENGTH = 16;
        this.assert = function (condition, message) {
            if (message === void 0) { message = "Assertion Failed"; }
            if (!condition) {
                throw new Error(message);
            }
            return true;
        };
        this.assertEqual = function (a, b) {
            if (a !== b) {
                var typeA = typeof a;
                var typeB = typeof b;
                throw new Error("[Assert] Expected " + typeA + " argument " + a + " to equal " + typeB + " argument " + b);
            }
            return true;
        };
        this.deepEqual = function (a, b) {
            if (Array.isArray(a)) {
                return (Array.isArray(b) &&
                    a.length === b.length &&
                    a.every(function (x, i) { return _this.deepEqual(x, b[i]); }));
            }
            else if (_this.isObject(a)) {
                var keys = Object.keys(a);
                return (_this.isObject(b) &&
                    Object.keys(b).length === keys.length &&
                    keys.every(function (k) { return _this.deepEqual(a[k], b[k]); }));
            }
            else {
                return Object.is(a, b);
            }
        };
        this.jsonDiff = function (a, b) {
            var aStrings = _this.stringify(a);
            var bStrings = _this.stringify(b);
            return "Expected: " + _this.truncateMiddle(aStrings) + "\nReceived: " + _this.truncateMiddle(bStrings);
        };
        // Just a shortcut for prettier json output
        this.stringify = function (x) { return JSON.stringify(x, null, 2); };
        this.truncateMiddle = function (x) {
            if (typeof x !== "string") {
                return x;
            }
            var lines = x.split("\n");
            if (lines.length > _this.MAX_LINE_LENGTH) {
                return (lines.slice(0, _this.MAX_LINE_LENGTH / 2).join("\n") +
                    ("\n... [" + (lines.length - _this.MAX_LINE_LENGTH) + " lines omitted] ...\n") +
                    lines.slice(-(_this.MAX_LINE_LENGTH / 2)).join("\n"));
            }
            else {
                return x;
            }
        };
        this.isObject = function (value) {
            return value !== null && !Array.isArray(value) && typeof value === "object";
        };
        // Determine if an object has the nested key path
        this.hasIn = function (_a, obj) {
            var k = _a[0], nextPath = _a.slice(1);
            if (k === undefined) {
                return true;
            }
            else if (obj.hasOwnProperty(k)) {
                return _this.hasIn(nextPath, obj[k]);
            }
            else {
                return false;
            }
        };
        /**
         * A Proxy handler to "negate" the results of function calls. In this case
         * negation means throwing when the method would otherwise not have thrown,
         * since this is to be used with the expect library
         */
        this.methodNegationProxyHandler = {
            get: function (obj, prop) {
                // We don't care about normal props. Just want to negate function call results
                // @ts-ignore
                if (typeof obj[prop] !== "function") {
                    // @ts-ignore
                    return obj[prop];
                }
                // Return a new function that will throw if and only if the original
                // function does not
                return function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    try {
                        // @ts-ignore
                        obj[prop].apply(obj, args);
                    }
                    catch (err) {
                        // We expected this throw, so everything is in order
                        return;
                    }
                    // If we get here then the original method did not through, so our .not
                    // handler is actually the one that needs to throw
                    throw new Error("[Negation] Expected " + obj.value + " NOT " + prop + "(" + args.join(", ") + ")");
                };
            }
        };
        // Get the value at a nested path in an object
        this.getIn = function (_a, obj, notSetValue) {
            var k = _a[0], nextPath = _a.slice(1);
            if (notSetValue === void 0) { notSetValue = undefined; }
            if (k === undefined) {
                return obj;
            }
            return _this.getIn(nextPath, obj[k]);
        };
        this.value = value;
        this.not = new Proxy(this, this.methodNegationProxyHandler);
    }
    /**
     * Checks that a value is what you expect. Does not perform deep equality
     * comparisons.
     */
    Expectation.prototype.toBe = function (expected) {
        this.assertEqual(this.value, expected);
    };
    /**
     * Assert that a value equals and expected value, performing deep
     * equality checks when appropriate.
     */
    Expectation.prototype.toEqual = function (expected) {
        this.assert(this.deepEqual(this.value, expected), "[Assert] Expected deep equality but got:\n" +
            this.jsonDiff(this.value, expected));
    };
    /**
     * For comparing floating point numbers.
     */
    Expectation.prototype.toBeGreaterThan = function (n) {
        this.assert(this.value > n, "[Assert] Expected " + this.value + " > " + n + " (GT)");
    };
    /**
     * For comparing floating point numbers.
     */
    Expectation.prototype.toBeGreaterThanOrEqual = function (n) {
        this.assert(this.value >= n, "[Assert] Expected " + this.value + " >= " + n + " (GTE)");
    };
    /**
     * For comparing floating point numbers.
     */
    Expectation.prototype.toBeLessThan = function (n) {
        this.assert(this.value < n, "[Assert] Expected " + this.value + " < " + n + " (LT)");
    };
    /**
     * For comparing floating point numbers.
     */
    Expectation.prototype.toBeLessThanOrEqual = function (n) {
        this.assert(this.value <= n, "[Assert] Expected " + this.value + " <= " + n + " (LTE)");
    };
    /**
     * Check that a string matches a regular expression.
     */
    Expectation.prototype.toMatch = function (strOrReg) {
        var matched = false;
        if (typeof this.value !== "string") {
            this.assert(false, "[Assert] toMatch cannot match a non-string value:" + this.value);
            return;
        }
        else if (typeof strOrReg === "string") {
            matched = this.value.includes(strOrReg);
        }
        else if (strOrReg.constructor === RegExp) {
            matched = strOrReg.test(this.value);
        }
        else {
            this.assert(false, "[Assert] toMatch passed invalid value. Use a string or a RegExp");
        }
        this.assert(matched, "[Assert] Expected \"" + this.truncateMiddle(this.value) + "\" to match " + strOrReg);
    };
    /**
     * Use to check if property at provided reference keyPath exists for an object.
     * For checking deeply nested properties in an object you may use dot notation or an array containing
     * the keyPath for deep references.
     *
     * Optionally, you can provide a value to check if it's equal to the value present at keyPath
     * on the target object. This matcher uses 'deep equality' (like `toEqual()`) and recursively checks
     * the equality of all fields.
     *
     * @example
     *
     * expect(houseForSale).toHaveProperty('kitchen.area', 20);
     */
    Expectation.prototype.toHaveProperty = function (keyPath, optionalTestValue) {
        if (typeof keyPath === "string") {
            keyPath = keyPath.split(".");
        }
        var hasProperty = this.hasIn(keyPath, this.value);
        if (optionalTestValue) {
            this.assert(hasProperty &&
                this.deepEqual(this.getIn(keyPath, this.value), optionalTestValue), "[Assert] Expected to have property " + keyPath.join("."));
        }
        else {
            this.assert(hasProperty, "[Assert] Expected at path " + keyPath.join(".") + ":\n" + this.truncateMiddle(this.stringify(optionalTestValue)) + "\nReceived: " + this.truncateMiddle(this.stringify(this.value)));
        }
    };
    /**
     * Use when you don't care what a value is, you just want to ensure a value
     * is true in a boolean context. In JavaScript, there are six falsy values:
     * `false`, `0`, `''`, `null`, `undefined`, and `NaN`. Everything else is truthy.
     */
    Expectation.prototype.toBeTruthy = function () {
        this.assertEqual(Boolean(this.value), true);
    };
    /**
     * When you don't care what a value is, you just want to
     * ensure a value is false in a boolean context.
     */
    Expectation.prototype.toBeFalsy = function () {
        this.assertEqual(Boolean(this.value), false);
    };
    /**
     * Using exact equality with floating point numbers is a bad idea.
     * Rounding means that intuitive things fail.
     * The default for numDigits is 2.
     */
    Expectation.prototype.toBeCloseTo = function (expected, precision) {
        if (precision === void 0) { precision = 2; }
        var received = this.value;
        if (typeof expected !== "number") {
            this.assert(false, "[Assert] toBeCloseTo passed invalid value. Needs a number but got: " + expected);
            return;
        }
        if (typeof expected !== "number") {
            this.assert(false, "[Assert] toBeCloseTo called but expectation contained invalid value. " + received);
            return;
        }
        var pass = false;
        var expectedDiff = 0;
        var receivedDiff = 0;
        if (received === Infinity && expected === Infinity) {
            pass = true; // Infinity - Infinity is NaN
        }
        else if (received === -Infinity && expected === -Infinity) {
            pass = true; // -Infinity - -Infinity is NaN
        }
        else {
            // Note: See Jest source code. I'm not sure why they divide by 2.
            // https://github.com/facebook/jest/blob/2a92e7f49fa35b219e5099d56b0179bccc1bf53e/packages/expect/src/matchers.ts#L170
            expectedDiff = Math.pow(10, -precision) / 2;
            receivedDiff = Math.abs(expected - received);
            pass = receivedDiff < expectedDiff;
        }
        this.assert(pass, "[Assert] toBeCloseTo expected " + expected + " to differ from " + received + " by less than " + expectedDiff + ". Actual diff was " + receivedDiff);
    };
    /**
     * Ensure that a variable is not undefined.
     */
    Expectation.prototype.toBeDefined = function () {
        this.assertEqual(typeof this.value !== "undefined", true);
    };
    /**
     * Used when you want to check that an item is in a list.
     * For testing the items in the list, this uses `===`, a strict equality check.
     *
     * Optionally, you can provide a type for the expected value via a generic.
     * This is particularly useful for ensuring expected objects have the right
     * structure.
     */
    Expectation.prototype.toContain = function (val) {
        var isValid = Array.isArray(this.value) || typeof this.value === "string";
        this.assert(isValid, "[Assert] toContain used on invalid value " + this.stringify(this.value));
        this.assert(this.value.includes(val), val + " not found in " + this.stringify(this.value));
    };
    /**
     * Used to test that a function throws when it is called.
     */
    Expectation.prototype.toThrow = function (optionalFailureMessage) {
        var didThrow = false;
        var errorMessage;
        try {
            // The function to test should be supplied in the initialization of
            // expect, e.g. expect(() => throw new Error("boom")).toThrow();
            this.value();
        }
        catch (err) {
            didThrow = true;
            errorMessage = err.message;
        }
        var defaultMessage = "[Assert] Expected code/function to not throw, but received this error message: " + errorMessage;
        var message = optionalFailureMessage || defaultMessage;
        this.assert(didThrow, message);
    };
    return Expectation;
}());
// @ts-ignore
var expect = function (x) { return new Expectation(x); };
/** ===========================================================================
 * Expose expectation library as a global on the window
 * ============================================================================
 */
// @ts-ignore
window.expect = expect;
