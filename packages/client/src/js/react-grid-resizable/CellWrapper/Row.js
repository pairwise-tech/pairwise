"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var styled_components_1 = __importDefault(require("styled-components"));
var Cell_1 = require("./Cell");
exports.Row = styled_components_1.default(Cell_1.Cell)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n    width: 100%;\n    flex: ", ";\n"], ["\n    width: 100%;\n    flex: ", ";\n"])), function (props) { return (props.initialHeight) ? 'none' : 1; });
var templateObject_1;
