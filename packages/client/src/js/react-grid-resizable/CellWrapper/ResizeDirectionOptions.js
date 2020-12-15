"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processOptions = function (options) {
    if (options === void 0) { options = {}; }
    var _a = options.top, top = _a === void 0 ? true : _a, _b = options.bottom, bottom = _b === void 0 ? true : _b, _c = options.left, left = _c === void 0 ? true : _c, _d = options.right, right = _d === void 0 ? true : _d, _e = options.disabled, disabled = _e === void 0 ? false : _e;
    if (disabled) {
        top = bottom = left = right = false;
    }
    return {
        top: top, bottom: bottom, left: left, right: right,
    };
};
