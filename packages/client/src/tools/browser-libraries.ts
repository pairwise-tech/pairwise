// NOTE: raw-loader! (as opposed to !raw-loader!) does not skip other loaders,
// so the TS file _will be_ compiled for us.

// @ts-ignore
import EXPECTATION_LIB from "!raw-loader!../js/browser-test-lib.js";

// @ts-ignore
import EXPECTATION_LIB_TYPES from "!raw-loader!../js/browser-test-lib.d.ts";

// @ts-ignore
import TEST_EXPECTATION_LIB from "!raw-loader!../js/test-expectation-lib.js";

// @ts-ignore
import TEST_EXPECTATION_LIB_TYPES from "!raw-loader!../js/test-expectation-lib.d.ts";

// @ts-ignore
import EXPRESS_JS_LIB from "!raw-loader!../js/express-js-lib.js";

// @ts-ignore
import EXPRESS_JS_LIB_TYPES from "!raw-loader!../js/express-js-lib.d.ts";

// @ts-ignore
import MONACO_TYPE_PATCHES from "!raw-loader!../monaco-types/monaco-type-patches.d.ts";

// @ts-ignore
import REACT_D_TS from "!raw-loader!../monaco-types/react.d.ts";

// @ts-ignore
import REACT_DOM_D_TS from "!raw-loader!../monaco-types/react-dom.d.ts";

const WORKSPACE_LIB = `
  ${EXPECTATION_LIB}
  ${TEST_EXPECTATION_LIB}
`;

const WORKSPACE_LIB_TYPES = `
  ${EXPECTATION_LIB_TYPES}
  ${TEST_EXPECTATION_LIB_TYPES}
`;

/**
 * Isolate this module to isolate the raw-loader from being pulled into
 * the Jest test environment.
 */
export {
  MONACO_TYPE_PATCHES,
  WORKSPACE_LIB,
  WORKSPACE_LIB_TYPES,
  REACT_D_TS,
  REACT_DOM_D_TS,
  TEST_EXPECTATION_LIB_TYPES,
  EXPRESS_JS_LIB,
  EXPRESS_JS_LIB_TYPES,
};
