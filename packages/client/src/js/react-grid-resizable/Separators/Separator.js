"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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
var getPositionFromDragEvent = function (direction, event) {
    if (direction == 'horizontal') {
        return event.clientX;
    }
    else {
        return event.clientY;
    }
};
/**
 * Set cursor and size of the separator
 */
var SeparatorDiv = styled_components_1.default.div(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n    user-select: none;\n    flex: none;\n    ", ": 100%;\n    ", ": 10px;\n    cursor: ", ";\n"], ["\n    user-select: none;\n    flex: none;\n    ", ": 100%;\n    ", ": 10px;\n    cursor: ", ";\n"])), function (props) { return props.direction == 'horizontal' ? 'height' : 'width'; }, function (props) { return props.direction == 'horizontal' ? 'width' : 'height'; }, function (props) { return props.direction == 'horizontal' ? 'e-resize' : 'n-resize'; });
exports.Separator = function (props) {
    var _a = react_1.useState(null), mousePositionAtLastMouseEvent = _a[0], setMousePositionAtLastMouseEvent = _a[1];
    var getMovedDistance = function (event) {
        var mousePosition = getPositionFromDragEvent(props.direction, event);
        return mousePosition - mousePositionAtLastMouseEvent;
    };
    /**
     * Start dragging
     * Record the initial mouse position to calculate distance later
     */
    var mouseDownEventHandler = function (event) {
        var mousePosition = getPositionFromDragEvent(props.direction, event);
        setMousePositionAtLastMouseEvent(mousePosition);
        props.onDragStart();
    };
    /**
     * End dragging
     * Clear initial mouse position, which will stop mouse move handling
     */
    var mouseUpEventHandler = function (event) {
        if (mousePositionAtLastMouseEvent) {
            setMousePositionAtLastMouseEvent(null);
        }
    };
    /**
     * Calculate distance from the initial mouse position when start dragging
     * Send the distance to parent component
     */
    var mouseMoveEventHandler = function (event) {
        if (mousePositionAtLastMouseEvent !== null && mousePositionAtLastMouseEvent !== undefined) {
            var movedDistance = getMovedDistance(event);
            props.onDrag(movedDistance);
        }
    };
    /**
     * Listen to mouse move and mouse up at global because the position of the separator
     * will not be updated at mouse position instantly
     */
    react_1.useEffect(function () {
        document.body.addEventListener('mouseup', mouseUpEventHandler);
        document.body.addEventListener('mousemove', mouseMoveEventHandler);
        return function () {
            document.body.addEventListener('mouseup', mouseUpEventHandler);
            document.body.removeEventListener('mousemove', mouseMoveEventHandler);
        };
    }, [mousePositionAtLastMouseEvent]);
    return react_1.default.createElement(SeparatorDiv, { style: props.style, className: props.className, direction: props.direction, onMouseDown: mouseDownEventHandler }, props.children);
};
var templateObject_1;
