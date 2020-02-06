import { pipe } from "ramda";
import * as Babel from "@babel/standalone";

import DependencyCacheService from "./dependency-service";
import { Challenge, CHALLENGE_TYPE } from "@pairwise/common";
import protect from "../js/loop-protect-lib.js";
import { TEST } from "./client-env";

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
 * Functions used to intercept console methods and post the messages to
 * the parent window.
 */
const CONSOLE_INTERCEPTOR_FUNCTIONS = `
const __replacer = (key, value) => {
  if (typeof value === "undefined") {
    return "__transform_undefined__";
  }

  return value;
}

const __interceptConsoleLog = (...value) => {
  window.parent.postMessage({
    message: JSON.stringify(value, __replacer),
    source: "LOG",
  });
}

const __interceptConsoleInfo = (...value) => {
  window.parent.postMessage({
    message: JSON.stringify(value, __replacer),
    source: "INFO",
  });
}

const __interceptConsoleWarn = (...value) => {
  window.parent.postMessage({
    message: JSON.stringify(value, __replacer),
    source: "WARN",
  });
}

const __interceptConsoleError = (...value) => {
  window.parent.postMessage({
    message: JSON.stringify(value, __replacer),
    source: "ERROR",
  });
}
`;

const INFINITE_LOOP_TIMEOUT = 2000;

/**
 * Register loop-protect Babel plugin.
 */
Babel.registerPlugin(
  "loopProtection",
  protect(INFINITE_LOOP_TIMEOUT, () => {
    throw new Error("INFINITE_LOOP");
  }),
);

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
  let dependencies: ReadonlyArray<string> = [];

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
  return codeString
    .replace(/console.log/g, "// ")
    .replace(/console.info/g, "// ")
    .replace(/console.warn/g, "// ")
    .replace(/console.error/g, "// ");
};

/**
 * Transpile the code use Babel standalone module.
 */
export const transpileCodeWithBabel = (codeString: string) => {
  /**
   * SUFFER!
   *
   * For some reason I couldn't get babel-standalone to transform class
   * properties which would break React code in the test environment. Instead
   * I just to the following hideous thing.
   *
   * TODO: Fix it and find a way to run everything through babel-standalone.
   */
  if (TEST) {
    return require("babel-core").transform(codeString, {
      presets: [
        "@babel/preset-react",
        ["@babel/preset-typescript", { isTSX: true, allExtensions: true }],
      ],
      plugins: ["@babel/plugin-proposal-class-properties"],
    }).code;
  } else {
    return Babel.transform(codeString, {
      presets: [
        "es2017",
        "react",
        ["typescript", { isTSX: true, allExtensions: true }],
      ],
      plugins: ["loopProtection"],
    }).code;
  }
};

/**
 * Get all imported dependencies from the DependencyCacheService.
 */
const fetchRequiredDependencies = async (
  dependencies: ReadonlyArray<string>,
) => {
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
  return result;
};

/**
 * Fetch the required module dependencies and inject them into the code string.
 */
export const createInjectDependenciesFunction = (
  dependencies: readonly string[],
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
  return `
    /* Via injectTestCode */
    {
      try {
        ${codeString}
      } catch (err) {
        if (err.message === "INFINITE_LOOP") {
          console.error("Infinite loop detected");
        }
      }
    }
    {
      ${getTestHarness(stripConsoleCalls(codeString), testCode)}
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
export const getTestHarness = (userCode: string, testCode: string): string => `
try {
  ${userCode}

  function buildTestsFromCode() {
    const testArray = [];
    const test = (message, fn) => {
      testArray.push({
            message,
            test: fn,
        })
    }

    ${testCode}

    return testArray;
  }

  function runTests() {
    const tests = buildTestsFromCode()

    const results = tests.reduce((agg, { message, test }) => {
      try {
        const _result = test();
        // Tests that pass using expect will return undefined, since they don't return anything.
        // TODO: At some point we will want to account for async tests, which will require
        // changes here
        const testResult = _result === undefined ? true : _result;
        return agg.concat([{
          message,
          testResult: testResult,
          error: null,
        }])
      } catch (err) {
        return agg.concat([{
          message,
          testResult: false,
          error: err.message + '\\n\\n' + err.stack,
        }])
      }
    }, []);

    return results;
  }

  try {
    const results = runTests();
    window.parent.postMessage({
      message: JSON.stringify(results),
      source: "${IFRAME_MESSAGE_TYPES.TEST_RESULTS}",
    });
  } catch (err) {
    window.parent.postMessage({
      message: JSON.stringify({
        error: err.message,
      }),
      source: "${IFRAME_MESSAGE_TYPES.TEST_ERROR}",
    });
  }
} catch (err) {
  if (err.message === "INFINITE_LOOP") {
    window.parent.postMessage({
      message: JSON.stringify({
        error: err.message,
      }),
      source: "${IFRAME_MESSAGE_TYPES.INFINITE_LOOP}",
    });
  }

  // compilation error, or something else happened
  // TODO: Still propagate this message back to the Workspace?
}
`;

/**
 * Put together the script tags necessary for running the tests in an iframe,
 * including the script that includes the tests themselves.
 */
export const getTestScripts = (testCode: string, testLib: string) => {
  return `
    <script id="test-code">${getTestHarness(
      getTestDependencies(testLib),
      testCode,
    )}</script>
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
    const testScript = getTestScripts(challenge.testCode, "");

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
