/* eslint-disable */
"use strict";

/**
 * NOTE: This is a clone of the react-grid-resizable library, original
 * source: https://github.com/netcell/react-grid-resizable.
 *
 * The library has not been updated and uses a React version which is
 * incompatible with our local, upgraded React version. The library has a
 * stale PR which is trying to fix this problem, which has not been merged.
 * As a workaround, I cloned the library, ran 'npm build' and dropped
 * the 'lib' output here and then imported these components in the
 * Workspace. This could be changed in the future if the original
 * library is upgraded, in which case the library could be re-installed
 * and this code removed. For now, this works.
 */

Object.defineProperty(exports, "__esModule", { value: true });
const RowsWrapper_1 = require("./GridWrapper/RowsWrapper");
exports.RowsWrapper = RowsWrapper_1.RowsWrapper;
const ColsWrapper_1 = require("./GridWrapper/ColsWrapper");
exports.ColsWrapper = ColsWrapper_1.ColsWrapper;
const Row_1 = require("./CellWrapper/Row");
exports.Row = Row_1.Row;
const Col_1 = require("./CellWrapper/Col");
exports.Col = Col_1.Col;
