"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = require("lodash");
var react_1 = __importDefault(require("react"));
var ResizeDirectionOptions_1 = require("../CellWrapper/ResizeDirectionOptions");
var useRefsWithInitialSize_1 = require("../hooks/useRefsWithInitialSize");
var Separator_1 = require("../Separators/Separator");
var getStylePropertyForSize = function (direction) {
    if (direction == 'horizontal') {
        return 'width';
    }
    else {
        return 'height';
    }
};
var getDirectionOptions = function (direction) {
    if (direction == 'horizontal') {
        return {
            current: 'left',
            previous: 'right'
        };
    }
    else {
        return {
            current: 'top',
            previous: 'bottom'
        };
    }
};
exports.GridWrapper = function (props) {
    var _a = useRefsWithInitialSize_1.useRefsWithInitialSize(props.direction), getRef = _a.getRef, resetRef = _a.resetRef, childrenWithRef = _a.childrenWithRef;
    var stylePropertyForSize = getStylePropertyForSize(props.direction);
    var directionOptions = getDirectionOptions(props.direction);
    var resizeElement = function (element, initialSize, sizeChange) {
        element.style[stylePropertyForSize] = initialSize + sizeChange + "px";
        /**
         * If the element is resized, the flex property must be set to `none`
         * Otherwise, the element will not be able to get smaller
         */
        element.style.flex = 'none';
    };
    /**
     * Create an event handler to save the size of the cells around the separator before dragging
     * @param currentIndex Index of the element after the separator
     */
    var dragStartHandlerCreator = function (currentIndex) { return function () {
        resetRef(currentIndex - 1);
        resetRef(currentIndex);
    }; };
    /**
     * Create an event handler to update the size of the cells around the separator when it is dragged
     * @param currentIndex Index of the element after the separator
     * @param resizeCurrent Should the element after the separator be resized
     * @param resizePrevious Should the element before the separator be resized
     */
    var dragHandlerCreator = function (currentIndex, resizeCurrent, resizePrevious) { return function (distance) {
        var previousRef = getRef(currentIndex - 1);
        var currentRef = getRef(currentIndex);
        var previousInitialSize = previousRef.initialSize;
        var currentInitialSize = currentRef.initialSize;
        /**
         * We need to clamp the distance so that it does not exceed the size of the elements around the separator
         * If we do not do this, when one element might receive negative number as size which is not a problem
         * but the problem is that the other element will start extending in size
         */
        distance = lodash_1.clamp(distance, resizePrevious ? -previousInitialSize : distance, resizeCurrent ? currentInitialSize : distance);
        if (resizePrevious) {
            resizeElement(previousRef.element, previousInitialSize, distance);
        }
        if (resizeCurrent) {
            resizeElement(currentRef.element, currentInitialSize, -distance);
        }
    }; };
    var childrenWithSeparator = childrenWithRef(props.children)
        /**
         * Insert Separator between children and set event handler
         */
        .reduce(function (newChildren, currentChild, currentIndex, children) {
        if (!newChildren.length) {
            return [
                currentChild,
            ];
        }
        else {
            var previousChild = lodash_1.last(newChildren);
            var resizePrevious = ResizeDirectionOptions_1.processOptions(previousChild.props)[directionOptions.previous];
            /**
             * Should not resize the last element in the grid if it is a flex one
             */
            var isLastElement = currentIndex == children.length - 1;
            var hasInitialSize = currentChild.props.initialHeight || currentChild.props.initialWidth;
            var resizeCurrent = (isLastElement && !hasInitialSize) ? false : ResizeDirectionOptions_1.processOptions(currentChild.props)[directionOptions.current];
            /**
             * Separator is not inserted if these elements don't want to be resized here
             */
            if (!resizePrevious && !resizeCurrent) {
                return newChildren.concat([
                    currentChild,
                ]);
            }
            else {
                var onDragStart = dragStartHandlerCreator(currentIndex);
                var onDrag = dragHandlerCreator(currentIndex, resizeCurrent, resizePrevious);
                return newChildren.concat([
                    react_1.default.createElement(Separator_1.Separator, __assign({ key: currentIndex - 1 + "-" + currentIndex }, props.separatorProps, { direction: props.direction, onDrag: onDrag, onDragStart: onDragStart })),
                    currentChild,
                ]);
            }
        }
    }, []);
    return react_1.default.createElement(react_1.default.Fragment, null, childrenWithSeparator);
};
