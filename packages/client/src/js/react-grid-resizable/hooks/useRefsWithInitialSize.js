"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importStar(require("react"));
var createRefWithInitialSize = function (direction, element) {
    var boundingClientRect = element.getBoundingClientRect();
    if (direction == 'horizontal') {
        return {
            element: element,
            initialSize: boundingClientRect.width,
        };
    }
    else {
        return {
            element: element,
            initialSize: boundingClientRect.height
        };
    }
};
/**
 * Creates a ref that save the `dom element` and the `initial size` for a list of elements. *
 * @param direction ["horizontal"|"vertical"] Direction to save initial size. `horizontal` uses `width` | `vertical` uses `height`.
 */
exports.useRefsWithInitialSize = function (direction) {
    var refs = react_1.useRef(null);
    var getRef = function (index) {
        var current = refs.current;
        return current ? current[index] : null;
    };
    var setRef = function (index, element) {
        if (!element)
            return;
        var current = refs.current;
        refs.current = current ? current.slice() : [];
        refs.current[index] = createRefWithInitialSize(direction, element);
    };
    var resetRef = function (index) {
        var current = refs.current;
        if (current && current[index] && current[index].element) {
            setRef(index, current[index].element);
        }
    };
    var childrenWithRef = function (children) {
        return react_1.Children.map(children, function (child, index) {
            var newProps = {};
            newProps.onRef = function (ref) { return setRef(index, ref); };
            return react_1.default.cloneElement(child, newProps);
        });
    };
    return {
        getRef: getRef,
        setRef: setRef,
        resetRef: resetRef,
        childrenWithRef: childrenWithRef,
    };
};
