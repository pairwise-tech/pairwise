// NOTE: raw-loader! (as opposed to !raw-loader!) does not skip other loaders,
// so the TS file _will be_ compiled for us.

// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import EXPECTATION_LIB from "raw-loader!../js/browser-test-lib.ts";

// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import EXPECTATION_LIB_TYPES from "!raw-loader!../js/browser-test-lib.d.ts";

/**
 * Isolate this module to isolate the raw-loader from being pulled into
 * the Jest test environment.
 */
export { EXPECTATION_LIB, EXPECTATION_LIB_TYPES };
