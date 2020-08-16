var Expectation = (function () {
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
        this.hasIn = function (_a, obj) {
            var k = _a[0], nextPath = _a.slice(1);
            if (k === undefined) {
                return true;
            }
            else if (obj.hasOwnProperty(k)) {
                return hasIn(nextPath, obj[k]);
            }
            else {
                return false;
            }
        };
        this.methodNegationProxyHandler = {
            get: function (obj, prop) {
                if (typeof obj[prop] !== "function") {
                    return obj[prop];
                }
                return function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    try {
                        obj[prop].apply(obj, args);
                    }
                    catch (err) {
                        return;
                    }
                    throw new Error("[Negation] Expected " + obj.value + " NOT " + prop + "(" + args.join(", ") + ")");
                };
            }
        };
        this.getIn = function (_a, obj, notSetValue) {
            var k = _a[0], nextPath = _a.slice(1);
            if (notSetValue === void 0) { notSetValue = undefined; }
            if (k === undefined) {
                return obj;
            }
            return getIn(nextPath, obj[k]);
        };
        this.value = value;
        this.not = new Proxy(this, this.methodNegationProxyHandler);
    }
    Expectation.prototype.toBe = function (expected) {
        this.assertEqual(this.value, expected);
    };
    Expectation.prototype.toEqual = function (expected) {
        this.assert(this.deepEqual(this.value, expected), "[Assert] Expected deep equality but got:\n" +
            this.jsonDiff(this.value, expected));
    };
    Expectation.prototype.toBeGreaterThan = function (n) {
        this.assert(this.value > n, "[Assert] Expected " + this.value + " > " + n + " (GT)");
    };
    Expectation.prototype.toBeGreaterThanOrEqual = function (n) {
        this.assert(this.value >= n, "[Assert] Expected " + this.value + " >= " + n + " (GTE)");
    };
    Expectation.prototype.toBeLessThan = function (n) {
        this.assert(this.value < n, "[Assert] Expected " + this.value + " < " + n + " (LT)");
    };
    Expectation.prototype.toBeLessThanOrEqual = function (n) {
        this.assert(this.value <= n, "[Assert] Expected " + this.value + " <= " + n + " (LTE)");
    };
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
    Expectation.prototype.toBeTruthy = function () {
        this.assertEqual(Boolean(this.value), true);
    };
    Expectation.prototype.toBeFalsy = function () {
        this.assertEqual(Boolean(this.value), false);
    };
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
            pass = true;
        }
        else if (received === -Infinity && expected === -Infinity) {
            pass = true;
        }
        else {
            expectedDiff = Math.pow(10, -precision) / 2;
            receivedDiff = Math.abs(expected - received);
            pass = receivedDiff < expectedDiff;
        }
        this.assert(pass, "[Assert] toBeCloseTo expected " + expected + " to differ from " + received + " by less than " + expectedDiff + ". Actual diff was " + receivedDiff);
    };
    Expectation.prototype.toBeDefined = function () {
        this.assertEqual(typeof this.value !== "undefined", true);
    };
    Expectation.prototype.toContain = function (val) {
        var isValid = Array.isArray(this.value) || typeof this.value === "string";
        this.assert(isValid, "[Assert] toContain used on invalid value " + this.stringify(this.value));
        this.assert(this.value.includes(val), val + " not found in " + this.stringify(this.value));
    };
    Expectation.prototype.toThrow = function (optionalFailureMessage) {
        var didThrow = false;
        var errorMessage;
        try {
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
var expect = function (x) { return new Expectation(x); };
window.expect = expect;
