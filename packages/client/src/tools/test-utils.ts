import * as Babel from "@babel/standalone";
import DependencyCacheService from "./dependency-service";
import { Challenge, CHALLENGE_TYPE } from "@pairwise/common";
import protect from "../js/loop-protect-lib.js";
import quote from "string-quote-x";
import pipe from "ramda/src/pipe";

// TODO: This could be made more secure
// NOTE: We will be dropping this string into another string so we want it stringified
const TARGET_WINDOW_ORIGIN = JSON.stringify("*");

// This not-so-robust code replacement exists because if we ourselves (using
// Codepress) added a script tag to a markup challenge we would accidentally
// exit the entire script tag and everything would break. So the gist is, we
// cannot allow the literal string "</script" into the user code string.
//
// NOTE: This is entirely due to the existence of __user_code_string__. If we
// did not try to stringify user code this would not happen. However, at present
// some of the challenge tests depend on this so it would be hard to go back. If
// it appears to be a more significant issue we can see what other means we have
// of stringifying user code.
const prepareUserCodeString = pipe(
  (x: string) => x.replace(/<\/script/gi, "<\\/script"), // See NOTE
  quote,
);

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

export enum IFRAME_MESSAGE_TYPES {
  LOG = "LOG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  TEST_RESULTS = "TEST_RESULTS",
  TEST_ERROR = "TEST_ERROR",
  INFINITE_LOOP = "INFINITE_LOOP",
}

export interface IframeMessageEvent extends MessageEvent {
  data: {
    message: string;
    source: IFRAME_MESSAGE_TYPES;
  };
}

export interface TestCase {
  test: string;
  message: string;
  testResult: boolean;
  error?: string;
}

export interface CodeFormatMessage {
  code: string;
  type: CHALLENGE_TYPE;
  channel: string;
}

export interface CodeFormatMessageEvent extends MessageEvent {
  data: CodeFormatMessage;
}

/**
 * Do nothing replacement for console for test environment to turn
 * console statements into dead-end code paths.
 */
const CONSOLE_NO_OP = `
  const consoleNoOp = (...args) => null;
`;

/**
 * Global test utils values which are available in the test
 * environment. These are mapped to a Codepress tooltip to
 * display them.
 */
export const TEST_UTILS_GLOBALS = {
  __secret_log_box: "Box of console.log messages",
  __secret_warn_box: "Box of console.warn messages",
  __secret_error_box: "Box of console.error messages",
  __secret_info_box: "Box of console.info messages",
  __user_code_string__: "Original string of user solution code",
  parseLogBox: "(box) => parseLogBox - parse a box of log messages",
  inBox: "(box, message) => boolean - given a box, find the message",
  pass: "A function to just pass a test",
  fail: "A function to just fail a test",
  stringList: "An array of 100 random strings",
  loremIpsum: "A paragraph of Lorem Ipsum text",
  __id: "() => generate a random string id",
  __randomInRange: "(min: number, max: number) => random number in range",
};

// Type representing all the globally available key names
type TEST_UTILS_GLOBALS_KEYS = {
  [key in keyof typeof TEST_UTILS_GLOBALS]: string;
};

// Just recreate the TEST_UTILS_GLOBALS object, mapping the keys
// as the values.
// @ts-ignore - whatever TypeScript!
const TEST_UTILS_GLOBALS_KEYS: TEST_UTILS_GLOBALS_KEYS = Object.keys(
  TEST_UTILS_GLOBALS,
).reduce((keys, key) => ({ ...keys, [key]: key }), {});

/**
 * Functions used to intercept console methods and post the messages to
 * the parent window.
 *
 * This also includes a "replacer" function that is passed into JSON.stringify
 * which intercepts values that do not serialize and replaces them with
 * "transform strings". We catch these strings on the other end and replace
 * them with their corresponding values to preserve the original logs.
 */
const CONSOLE_INTERCEPTOR_FUNCTIONS = `
const __replacer = (key, value) => {
  if (typeof value === "undefined") {
    return "__transform_undefined__";
  }
  if (typeof value === "number" && isNaN(value)) {
    return "__transform_NaN__";
  }
  if (typeof value === "number" && value === Infinity) {
    return "__transform_Infinity__";
  }
  // for symbols, include the identifier, if any, that was passed into the
  // symbol "constructor". When we replace the transform string on the other end,
  // we parse "symbolFrom" out of the string and use it to create a new Symbol
  if (typeof value === "symbol") {
    const symbolStr = value.toString();
    const symbolFrom = symbolStr.slice(symbolStr.indexOf("(") + 1, -1);
    return "__transform_symbol_from:" + symbolFrom;
  }

  return value;
}

let ${TEST_UTILS_GLOBALS_KEYS.__secret_log_box} = [];
let ${TEST_UTILS_GLOBALS_KEYS.__secret_warn_box} = [];
let ${TEST_UTILS_GLOBALS_KEYS.__secret_error_box} = [];
let ${TEST_UTILS_GLOBALS_KEYS.__secret_info_box} = [];

const __interceptConsoleLog = (...value) => {
  const message = JSON.stringify(value, __replacer);
  __secret_log_box.push(message);
  window.parent.postMessage({ message, source: "LOG" }, ${TARGET_WINDOW_ORIGIN});
}

const __interceptConsoleInfo = (...value) => {
  const message = JSON.stringify(value, __replacer);
  __secret_info_box.push(message);
  window.parent.postMessage({ message, source: "INFO" }, ${TARGET_WINDOW_ORIGIN});
}

const __interceptConsoleWarn = (...value) => {
  const message = JSON.stringify(value, __replacer);
  __secret_warn_box.push(message);
  window.parent.postMessage({ message, source: "WARN" }, ${TARGET_WINDOW_ORIGIN});
}

const __interceptConsoleError = (...value) => {
  const message = JSON.stringify(value, __replacer);
  __secret_error_box.push(message);
  window.parent.postMessage({ message, source: "ERROR" }, ${TARGET_WINDOW_ORIGIN});
}
`;

/** ===========================================================================
 * Test Utils
 * ============================================================================
 */

/**
 * This function is supposed to match all import statements in the code string
 * and remove them, while also identifying the imported libraries and returning
 * those in an array by name, so they can be fetched from a CDN and injected
 * into the code before it is transpiled and run.
 *
 * The code may not work 100%:
 */
export const stripAndExtractModuleImports = (codeString: string) => {
  // Reference: https://gist.github.com/manekinekko/7e58a17bc62a9be47172
  const regex = new RegExp(
    /import(?:["'\s]*([\w*{}\n\r\t, ]+)from\s*)?["'\s].*([@\w/_-]+)["'\s].*/g,
  );
  const result = codeString.match(regex);

  let strippedImports = codeString;
  let dependencies: string[] = [];

  if (result) {
    for (const importStatement of result) {
      const libs = importStatement.match(/"(.*?)"/);
      if (libs) {
        dependencies = dependencies.concat(libs[1]);
      }

      strippedImports = strippedImports.replace(importStatement, "");
    }
  }

  return {
    dependencies,
    code: strippedImports,
  };
};

/**
 * Replace all console.log statements with a call to a custom function which
 * is injected on the top of the code string before it is run. The custom
 * function will post a message outside of the iframe to the parent window
 * object, which is listening to capture these messages and serve them to the
 * workspace console.
 */
export const hijackConsole = (codeString: string) => {
  const replacedConsole = codeString
    .replace(/console.log/g, "__interceptConsoleLog")
    .replace(/console.info/g, "__interceptConsoleInfo")
    .replace(/console.warn/g, "__interceptConsoleWarn")
    .replace(/console.error/g, "__interceptConsoleError");

  return `${CONSOLE_INTERCEPTOR_FUNCTIONS}${replacedConsole}`;
};

/**
 * Remove all calls to console methods in a code string. This just removes
 * them with // to create a comment which will not be evaluated... this could
 * create problems if the console statement was written inline with some
 * real code, which would then no longer execute...
 */
export const stripConsoleCalls = (codeString: string) => {
  const noOpConsole = codeString
    .replace(/console.log/g, "consoleNoOp")
    .replace(/console.info/g, "consoleNoOp")
    .replace(/console.warn/g, "consoleNoOp")
    .replace(/console.error/g, "consoleNoOp");

  return `${CONSOLE_NO_OP}${noOpConsole}`;
};

/**
 * Register loop-protect Babel plugin.
 */
Babel.registerPlugin("loopProtection", protect(2000));

/**
 * Transpile the code use Babel standalone module.
 */
export const transpileCodeWithBabel = (codeString: string) => {
  const plugins = ["loopProtection"];
  return Babel.transform(codeString, {
    presets: [
      "es2017",
      "react",
      ["typescript", { isTSX: true, allExtensions: true }],
    ],
    plugins,
  }).code;
};

/**
 * Get all imported dependencies from the DependencyCacheService.
 */
const fetchRequiredDependencies = async (dependencies: string[]) => {
  return Promise.all(dependencies.map(DependencyCacheService.getDependency));
};

/**
 * Concatenate package source dependencies to code string.
 */
const injectDependencies = (
  codeString: string,
  dependencies: readonly string[],
) => {
  let result = "";

  for (const dependency of dependencies) {
    result += `${dependency}\n`;
  }

  result += codeString;

  /**
   * It's possible, given the user's input and the challenge requirements,
   * that an error is thrown at this level (e.g. if dependencies are not
   * imported by the user). We could consider solving this in different
   * ways, but it's more relevant for challenges which use imports, e.g.
   * React, which are less prevalent now, so for now I am just wrapping
   * and throwing the compilation failed error. Without this, the error
   * would instead propagate out uncaught, and the workspace would be
   * trapped in the "tests loading" state.
   */
  const tryCatchResultString = `
  try {
    ${result}
  } catch (err) {
    window.parent.postMessage({
      message: JSON.stringify([
        {
          testResult: false,
          error: err.message + "\\n" + err.stack,
          message: "The code should compile and not throw any errors.",
        }
      ]),
      source: "${IFRAME_MESSAGE_TYPES.TEST_RESULTS}",
    }, ${TARGET_WINDOW_ORIGIN});
  }
  `;

  return tryCatchResultString;
};

/**
 * Fetch the required module dependencies and inject them into the code string.
 */
export const createInjectDependenciesFunction = (
  dependencies: string[],
) => async (codeString: string) => {
  /**
   * TODO: The following method could throw an error if an imported package
   * cannot be found, this should be handled somewhere.
   */
  const dependencySourceList = await fetchRequiredDependencies(dependencies);
  const codeWithDependencies = injectDependencies(
    codeString,
    dependencySourceList,
  );

  return codeWithDependencies;
};

const TEST_GATHERING_PREFIX = `
  const __USER_TEST_LIST__ = [];
  const test = (message, fn) => {
    __USER_TEST_LIST__.push({
      message,
      test: fn,
    });
  }
`;

/**
 * Inject test code into a code string.
 *
 * The test string is injected twice. The first injection runs normally
 * and produces the output the user will see. The second injection is
 * enclosed in a new scope and combined with the test code, the console
 * is also modified and removed.
 *
 * Together, this creates one code string which is executed to produce the
 * preview for the user and the test results for the workspace.
 */
export const injectTestCode = (testCode: string) => (codeString: string) => {
  const CODE_WITH_TEST_PREFIX = `${TEST_GATHERING_PREFIX}\n${codeString}`;
  return `
    /* Via injectTestCode */
    {
      try {
        ${CODE_WITH_TEST_PREFIX}
      } catch (err) {
        if (err.message === "INFINITE_LOOP") {
          console.error("Infinite loop detected");
        } else {
          console.error(err.message + "\\n" + err.stack);
        }
      }
    }
    {
      ${getTestHarness(
        stripConsoleCalls(CODE_WITH_TEST_PREFIX),
        codeString,
        testCode,
      )}
    }
    `;
};

/**
 * Get the full html content string for the iframe, injected the user code
 * into it. This currently includes script libraries now.
 *
 * NOTE: I'd like to unify the markdown and ts tests so that when building the
 * markup they would both use some common function like this, but we're not
 * there yet.
 */
export const getMarkupForCodeChallenge = (
  scriptString: string,
  deps: string,
) => `
<html>
  <head></head>
  <body>
    <div id="root" />
    <script id="test-dependencies">${getTestDependencies(deps)}</script>
    <script id="test-code">${scriptString}</script>
  </body>
</html>
`;

/**
 * This is just exported as a function for consistency and in case we need to
 * augment it later.
 *
 * NOTE: This function takes the dependency library as an input. This is a
 * workaround to allow us to inject the dependency library at runtime, because
 * this method runs in the Jest environment and the app, but for the app
 * the dependency file is imported with a raw-loader which is incompatible
 * with Jest.
 */
export const getTestDependencies = (testLib: string): string => testLib;

/**
 * Get the test code string for a markup challenge.
 */
export const getTestHarness = (
  preamble: string,
  userCode: string,
  testCode: string,
): string => `
(async function() {
  try {
    ${preamble}

    // Fixed helper constants to be used in the test environment.
    ${TEST_HELPER_CONSTANTS}

    // use as a fallback when the only way to test user code is by regexp.
    // purposefully named against conventions to avoid collisions with user vars
    const ${
      TEST_UTILS_GLOBALS_KEYS.__user_code_string__
    } = ${prepareUserCodeString(userCode)};

    function buildTestsFromCode() {
      const testArray = [];
      const test = (message, fn) => {
        testArray.push({
            message,
            test: fn,
        });
      }

      ${testCode}

      return testArray;
    }

    async function runTestsAsync() {
      const tests = buildTestsFromCode();
      const testResults = await Promise.all(tests.map(async ({ message, test }) => {
        try {
          const _result = await test();
          return {
            message,
            testResult: true, // If we get here it didn't throw, so it passed
            error: null,
          };
        } catch (err) {
          return {
            message,
            testResult: false,
            error: err.message + '\\n\\n' + err.stack,
          };
        }
      }));

      return testResults.flat();
    }

    try {
      const results = await runTestsAsync();
      window.parent.postMessage({
        message: JSON.stringify(results),
        source: "${IFRAME_MESSAGE_TYPES.TEST_RESULTS}"
      }, ${TARGET_WINDOW_ORIGIN});
    } catch (err) {
      window.parent.postMessage({
        message: JSON.stringify([
          {
            testResult: false,
            error: err.message + "\\n" + err.stack,
            message: "Something failed with the tests. This should not happen in production.",
          }
        ]),
        source: "${IFRAME_MESSAGE_TYPES.TEST_ERROR}"
      }, ${TARGET_WINDOW_ORIGIN});
    }
  } catch (err) {
    if (err.message === "INFINITE_LOOP") {
      window.parent.postMessage({
        message: JSON.stringify({
          error: err.message,
        }),
        source: "${IFRAME_MESSAGE_TYPES.INFINITE_LOOP}",
      }, ${TARGET_WINDOW_ORIGIN});
    } else {
      window.parent.postMessage({
        message: JSON.stringify([
          {
            testResult: false,
            error: err.message + "\\n" + err.stack,
            message: "The code should compile and not throw any errors.",
          }
        ]),
        source: "${IFRAME_MESSAGE_TYPES.TEST_RESULTS}",
      }, ${TARGET_WINDOW_ORIGIN});
    }
  }
})();
`;

/**
 * Put together the script tags necessary for running the tests in an iframe,
 * including the script that includes the tests themselves.
 */
export const getTestScripts = (
  userCode: string,
  testCode: string,
  testLib: string,
) => {
  return `
    <script id="test-code">
      ${getTestHarness(getTestDependencies(testLib), userCode, testCode)}
    </script>
  `;
};

/**
 * Uses the browsers own internal engine to clean up HTML. The reason to do this
 * is to standardize HTML output from the user before work work with it
 * internally
 */
export const tidyHtml = (html: string) => {
  const el = document.createElement("html");
  el.innerHTML = html;
  return el.innerHTML;
};

/**
 * Process code string and test code for markup challenges to include the
 * test code in an included script tag and ensure all of it is wrapped in
 * a body tag. This can then be injected as the iframe source document.
 *
 * NOTE: Expectation library needs to be passed here from the workspace,
 * it cannot be imported in this file or it will break in the test environment.
 */
export const getMarkupSrcDocument = (
  code: string,
  testCode: string,
  expectationLibrary: string, // see NOTE
): string => {
  const testScript = getTestScripts(code, testCode, expectationLibrary);

  // NOTE: Tidy html should ensure there is indeed a closing body tag
  const tidySource = tidyHtml(code);

  // Just to give us some warning if we ever hit this. Should be impossible...
  if (!tidySource.includes("</body>")) {
    console.warn(
      "[Err] Could not append test code to closing body tag in markup challenge",
    );
  }

  // TODO: There's no reason for us to inject the test script in sandbox
  // mode, but the same applies to all challenge types so ideally we
  // would standardize the testing pipeline to the point where we could
  // include that logic in one place only.
  return tidySource.replace("</body>", `${testScript}</body>`);
};

/**
 * Compile and process the code string for any challenge. Return compiled code
 * which can be run in the tests.
 *
 * NOTE: This function is async because createInjectDependenciesFunction
 * returns an async function.
 *
 * TODO: Refactor and unify the markup challenge with the other regular
 * code challenges.
 */
export const compileCodeString = async (
  sourceCodeString: string,
  challenge: Challenge,
) => {
  if (challenge.type === "markup") {
    const testScript = getTestScripts(sourceCodeString, challenge.testCode, "");

    // NOTE: Tidy html should ensure there is indeed a closing body tag
    const tidySource = tidyHtml(sourceCodeString);

    // Just to give us some warning if we ever hit this. Should be impossible...
    if (!tidySource.includes("</body>")) {
      console.warn(
        "[Err] Could not append test code to closing body tag in markup challenge",
      );
    }

    /**
     * TODO: There's no reason for us to inject the test script in sandbox
     * mode, but the same applies to all challenge types so ideally we
     * would standardize the testing pipeline to the point where we could
     * include that logic in one place only.
     */
    const sourceDocument = tidySource.replace(
      "</body>",
      `${testScript}</body>`,
    );

    return { code: sourceDocument, dependencies: [""] };
  } else {
    const { code: sourceCode, dependencies } = stripAndExtractModuleImports(
      sourceCodeString,
    );

    const injectModuleDependenciesFn = createInjectDependenciesFunction(
      challenge.type === "react"
        ? [...dependencies, "react-dom-test-utils"]
        : dependencies,
    );

    /**
     * What happens here:
     *
     * - Inject test code in code string, and remove any console methods
     * - Hijack all console usages in user code string
     * - Apply Babel transform steps
     * - Fetch and inject required modules into code string
     */
    const processedCodeString = await pipe(
      injectTestCode(challenge.testCode),
      hijackConsole,
      transpileCodeWithBabel,
      injectModuleDependenciesFn,
    )(sourceCode);

    return {
      dependencies,
      code: processedCodeString,
    };
  }
};

/**
 * A helper run when a new challenge is loaded to enable the user to preview
 * test messages without the tests being run (which is disabled for TS
 * challenges to avoid infinite loops / recursion which can be very
 * hard for the user to recover from)
 *
 * NOTE:
 * The regex below could be simplified, but matching on the beginning of the
 * test callback helps it to be a bit closer to foolproof in case a test happens
 * to be on a single line, e.g. test("...", () => {...});
 */
export const buildPreviewTestResultsFromCode = (
  testCode: string,
): { results?: TestCase[]; error?: Error } => {
  try {
    const re = /(?<=test\().+,\s?(?:async)?\s?\(\)\s?=>/g;
    const matches = testCode.match(re) ?? [];
    const results = matches.map(match => ({
      message: match.slice(1, match.lastIndexOf(",") - 1),
      testResult: false,
      test: "",
    }));

    if (results.length === 0) {
      throw new Error("Unable to extract test messages from test code!");
    }

    return {
      results,
    };
  } catch (error) {
    return {
      error,
    };
  }
};

/**
 * An array of 100 random string values which is populated in the
 * test environment to use as a source of fixed data for writing
 * challenge tests.
 */
const TEST_HELPER_CONSTANTS = `
const loremIpsum = "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose injected humour and the like.";

const stringList = [
  "QVRYdrkdVw",
  "0pWPuoHqRw",
  "le5J7biZ6t",
  "AUfg0JRWwl",
  "WQe8SRvXeY",
  "6RWbBD2Y94",
  "QXdo2erD1p",
  "c203WhArZ3",
  "e5keBaaAGQ",
  "UEtDLsH8bg",
  "GAsU1wEC4a",
  "MKlgZBNSw9",
  "5dUzk7nyeK",
  "L0AlHTLiWV",
  "xwZemS1nY2",
  "lq0tSDkJwe",
  "xpLIPZsInJ",
  "j514vU8LH6",
  "orLHidHocj",
  "P9AcPdVPoF",
  "mNkAf7Qjq1",
  "kyfoYXVSF1",
  "SOkccTFJ5F",
  "7cgQqgZOgE",
  "MY7U0BJDw0",
  "q6rct7tNwr",
  "drE2n9YAiC",
  "KOHQ7kt50Q",
  "pZD726HvCX",
  "w1CxnpEDEt",
  "Tj6FjHXL4N",
  "vQFfx6qpw5",
  "bXnKCZz4Nr",
  "FfUWj42rgv",
  "rGae85UvFH",
  "tyXGV7aKgL",
  "zCxkZ7cYCF",
  "gxXQcqc3sD",
  "z5LsQl10HC",
  "shBCEdn1ql",
  "Jl1LFpR3vE",
  "1awcpUFLD9",
  "htW55BxWYP",
  "RoM6BFqtIE",
  "k7ymKDJhzC",
  "VrvPT4R95I",
  "fpZmdWma3b",
  "dR5RqldNin",
  "vwWmWWTnOP",
  "f3p1vThSFP",
  "9N4Xn0tw7X",
  "z3BEZdTBnO",
  "0fRulMGsG0",
  "56dNhTAlpW",
  "0n1NB0l419",
  "jFgrd053l9",
  "w61n93wIlv",
  "u2S7f1OcVN",
  "XYqrPrJGdS",
  "Fkxjdb9Dlt",
  "OsT1N4XoyW",
  "E6jR7NhmL4",
  "1dgY7OIoXa",
  "PLQ3KnDcHN",
  "YuQSm9ALxE",
  "Syzup76N9c",
  "QnkA6NPj7H",
  "TipsiCgGFj",
  "sbyvRL5YXy",
  "QAUmWxzCzr",
  "0SJIupX54D",
  "jFdZYIK0t1",
  "rTSC0QtFRv",
  "pcAthU0Jth",
  "u6IZETUtNU",
  "UzWqlFnkjH",
  "RKv42wyewb",
  "oaKrrKwWme",
  "6T6mab8Pfm",
  "oqFlSsv5Gx",
  "H6RturqShP",
  "LY00Zq9aoV",
  "uZKDkDJOHC",
  "M64RjYLFHW",
  "hLtOzPf6zm",
  "Ff1NrGC3oP",
  "BD4gkrsAuE",
  "1N13l8Nfdz",
  "JpThfDtb7B",
  "GHOWoEwsri",
  "1zkHNjYTzW",
  "ANJsMHGfrj",
  "GXzyQvoDuZ",
  "oQ60uBbp1n",
  "GT5btNBeYi",
  "Jr2kLMQPa8",
  "dKedTpfo94",
  "JqVTEc9VvT",
  "nYglUHWXI9",
  "GV2c3JIdVA",
];`;
