// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import EXPECTATION_LIB from "!raw-loader!./in-browser-testing-lib";

/**
 * Isolate this module to isolate the raw-loader from being pulled into
 * the Jest test environment.
 */
export { EXPECTATION_LIB };
