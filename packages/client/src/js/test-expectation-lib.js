var MAX_LINE_LENGTH = 16;
var assert = function (condition, message) {
    if (message === void 0) { message = "Assertion Failed"; }
    if (!condition) {
        throw new Error(message);
    }
    return true;
};
var assertEqual = function (a, b) {
    if (a !== b) {
        var typeA = typeof a;
        var typeB = typeof b;
        throw new Error("[Assert] Expected " + typeA + " argument " + a + " to equal " + typeB + " argument " + b);
    }
    return true;
};
var deepEqual = function (a, b) {
    if (Array.isArray(a)) {
        return (Array.isArray(b) &&
            a.length === b.length &&
            a.every(function (x, i) { return deepEqual(x, b[i]); }));
    }
    else if (isObject(a)) {
        var keys = Object.keys(a);
        return (isObject(b) &&
            Object.keys(b).length === keys.length &&
            keys.every(function (k) { return deepEqual(a[k], b[k]); }));
    }
    else {
        return Object.is(a, b);
    }
};
var jsonDiff = function (a, b) {
    var aStrings = stringify(a);
    var bStrings = stringify(b);
    return "Expected: " + truncateMiddle(aStrings) + "\nReceived: " + truncateMiddle(bStrings);
};
var stringify = function (x) { return JSON.stringify(x, null, 2); };
var truncateMiddle = function (x) {
    if (typeof x !== "string") {
        return x;
    }
    var lines = x.split("\n");
    if (lines.length > MAX_LINE_LENGTH) {
        return (lines.slice(0, MAX_LINE_LENGTH / 2).join("\n") +
            ("\n... [" + (lines.length - MAX_LINE_LENGTH) + " lines omitted] ...\n") +
            lines.slice(-(MAX_LINE_LENGTH / 2)).join("\n"));
    }
    else {
        return x;
    }
};
var isObject = function (value) {
    return value !== null && !Array.isArray(value) && typeof value === "object";
};
var hasIn = function (_a, obj) {
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
var getIn = function (_a, obj, notSetValue) {
    var k = _a[0], nextPath = _a.slice(1);
    if (notSetValue === void 0) { notSetValue = undefined; }
    if (k === undefined) {
        return obj;
    }
    return getIn(nextPath, obj[k]);
};
var methodNegationProxyHandler = {
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
var Expectation = (function () {
    function Expectation(value) {
        this.value = value;
        this.not = new Proxy(this, methodNegationProxyHandler);
    }
    Expectation.prototype.find = function () {
        return true;
    };
    Expectation.prototype.toBe = function (expected) {
        assertEqual(this.value, expected);
    };
    Expectation.prototype.toEqual = function (expected) {
        assert(deepEqual(this.value, expected), "[Assert] Expected deep equality but got:\n" +
            jsonDiff(this.value, expected));
    };
    Expectation.prototype.toBeGreaterThan = function (n) {
        assert(this.value > n, "[Assert] Expected " + this.value + " > " + n + " (GT)");
    };
    Expectation.prototype.toBeGreaterThanOrEqual = function (n) {
        assert(this.value >= n, "[Assert] Expected " + this.value + " >= " + n + " (GTE)");
    };
    Expectation.prototype.toBeLessThan = function (n) {
        assert(this.value < n, "[Assert] Expected " + this.value + " < " + n + " (LT)");
    };
    Expectation.prototype.toBeLessThanOrEqual = function (n) {
        assert(this.value <= n, "[Assert] Expected " + this.value + " <= " + n + " (LTE)");
    };
    Expectation.prototype.toMatch = function (strOrReg) {
        var matched = false;
        if (typeof this.value !== "string") {
            assert(false, "[Assert] toMatch cannot match a non-string value:" + this.value);
            return;
        }
        else if (typeof strOrReg === "string") {
            matched = this.value.includes(strOrReg);
        }
        else if (strOrReg.constructor === RegExp) {
            matched = strOrReg.test(this.value);
        }
        else {
            assert(false, "[Assert] toMatch passed invalid value. Use a string or a RegExp");
        }
        assert(matched, "[Assert] Expected \"" + truncateMiddle(this.value) + "\" to match " + strOrReg);
    };
    Expectation.prototype.toHaveProperty = function (keyPath, optionalTestValue) {
        if (typeof keyPath === "string") {
            keyPath = keyPath.split(".");
        }
        var hasProperty = hasIn(keyPath, this.value);
        if (optionalTestValue) {
            assert(hasProperty && deepEqual(getIn(keyPath, this.value), optionalTestValue), "[Assert] Expected to have property " + keyPath.join("."));
        }
        else {
            assert(hasProperty, "[Assert] Expected at path " + keyPath.join(".") + ":\n" + truncateMiddle(stringify(optionalTestValue)) + "\nReceived: " + truncateMiddle(stringify(this.value)));
        }
    };
    Expectation.prototype.toBeTruthy = function () {
        assertEqual(Boolean(this.value), true);
    };
    Expectation.prototype.toBeFalsy = function () {
        assertEqual(Boolean(this.value), false);
    };
    Expectation.prototype.toBeCloseTo = function (expected, precision) {
        if (precision === void 0) { precision = 2; }
        var received = this.value;
        if (typeof expected !== "number") {
            assert(false, "[Assert] toBeCloseTo passed invalid value. Needs a number but got: " + expected);
            return;
        }
        if (typeof expected !== "number") {
            assert(false, "[Assert] toBeCloseTo called but expectation contained invalid value. " + received);
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
        assert(pass, "[Assert] toBeCloseTo expected " + expected + " to differ from " + received + " by less than " + expectedDiff + ". Actual diff was " + receivedDiff);
    };
    Expectation.prototype.toBeDefined = function () {
        assertEqual(typeof this.value !== "undefined", true);
    };
    Expectation.prototype.toContain = function (val) {
        var isValid = Array.isArray(this.value) || typeof this.value === "string";
        assert(isValid, "[Assert] toContain used on invalid value " + stringify(this.value));
        assert(this.value.includes(val), val + " not found in " + stringify(this.value));
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
        assert(didThrow, message);
    };
    return Expectation;
}());
var expect = function (x) { return new Expectation(x); };
window.expect = expect;
window.assert = assert;
window.assertEqual = assertEqual;
