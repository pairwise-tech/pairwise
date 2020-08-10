var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
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
var checkBoxAsync = function (box, message, delay) { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2, new Promise(function (resolve) {
                setTimeout(function () {
                    var result = inBox(box, message);
                    resolve(result);
                }, delay);
            })];
    });
}); };
var wait = function (time) { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2, new Promise(function (resolve) { return setTimeout(resolve, time); })];
    });
}); };
var fail = function () { return expect(false).toBe(true); };
var pass = function () { return expect(true).toBe(true); };
var __id = function () {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
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
window.get = get;
window.getAll = getAll;
window.getStyle = getStyle;
window.getText = getText;
window.assert = assert;
window.assertEqual = assertEqual;
window.expect = expect;
