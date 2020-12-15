"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importStar(require("react"));
var styled_components_1 = __importDefault(require("styled-components"));
exports.Cell = styled_components_1.default(function (props) {
    var _a = react_1.useState(null), initialWidth = _a[0], setInitialWidth = _a[1];
    var _b = react_1.useState(null), initialHeight = _b[0], setInitialHeight = _b[1];
    react_1.useEffect(function () {
        setInitialHeight(props.initialHeight);
        setInitialWidth(props.initialWidth);
    }, []);
    return react_1.default.createElement("div", { ref: props.onRef, style: __assign({ height: initialHeight, width: initialWidth }, props.style), className: props.className }, props.children);
})(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n    box-sizing: border-box;\n    overflow: hidden;\n"], ["\n    box-sizing: border-box;\n    overflow: hidden;\n"])));
var templateObject_1;
