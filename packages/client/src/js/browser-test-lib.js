var MAX_LINE_LENGTH = 16;
var get = function (selector) { return document.querySelector(selector); };
var getAll = function (selector) {
    return Array.prototype.slice.call(document.querySelectorAll(selector));
};
var getStyle = function (el, cssProp, pseudoSelector) {
    if (pseudoSelector === void 0) { pseudoSelector = null; }
    var view = el.ownerDocument && el.ownerDocument.defaultView
        ? el.ownerDocument.defaultView
        : window;
    var style = view.getComputedStyle(el, pseudoSelector);
    return style.getPropertyValue(cssProp) || style[cssProp];
};
var getText = function (selector) {
    try {
        var element = get(selector);
        var html = element.innerHTML;
        return html.trim();
    }
    catch (err) {
        throw err;
    }
};
var css = function (propName, value) {
    var dummy = get("#dummy-test-div");
    if (!dummy) {
        dummy = document.createElement("div");
        dummy.id = "dummy-test-div";
        dummy.style.display = "none";
        document.body.appendChild(dummy);
    }
    var initial = dummy.style[propName];
    dummy.style[propName] = value;
    var result = getStyle(dummy, propName);
    dummy.style[propName] = initial;
    return result;
};
var cssColor = function (value) { return css("color", value); };
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
var deepEqual = function (a, b) {
    if (Array.isArray(a)) {
        return (Array.isArray(b) &&
            a.length === b.length &&
            a.every(function (x, i) { return deepEqual(x, b[i]); }));
    }
    else if (isObject(a)) {
        var keys = Object.keys(a);
        return (isObject(b) &&
            Object.keys(b).length == keys.length &&
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
var parseLogBox = function (box) {
    var parsedBoxLogs = box.map(function (x) { return JSON.parse(x); });
    var messageBox = parsedBoxLogs.map(function (x) { return x[0]; });
    return messageBox;
};
var inBox = function (box, message) {
    var result = box.find(function (m) { return m === message; });
    return !!result;
};
var fail = function () { return expect(false).toBe(true); };
var pass = function () { return expect(true).toBe(true); };
var __id = function () {
    return (Math.random()
        .toString(36)
        .substring(2) + Date.now().toString(36));
};
var __randomInRange = function (min, max) {
    return Math.round(Math.random() * (max - min) + min);
};
var Expectation = (function () {
    function Expectation(value) {
        this.value = value;
        this.not = new Proxy(this, methodNegationProxyHandler);
    }
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
window.get = get;
window.getAll = getAll;
window.getStyle = getStyle;
window.getText = getText;
window.assert = assert;
window.assertEqual = assertEqual;
window.expect = expect;
