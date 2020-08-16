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
    return (Math.random()
        .toString(36)
        .substring(2) + Date.now().toString(36));
};
var __randomInRange = function (min, max) {
    return Math.round(Math.random() * (max - min) + min);
};
window.get = get;
window.getAll = getAll;
window.getStyle = getStyle;
window.getText = getText;
