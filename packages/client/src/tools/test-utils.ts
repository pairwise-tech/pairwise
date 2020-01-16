import { pipe } from "ramda";
import * as Babel from "@babel/standalone";

import DependencyCacheService from "./module-service";
import { Challenge } from "@pairwise/common";

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
}

export interface IframeMessageEvent extends MessageEvent {
  data: {
    message: string;
    source: IFRAME_MESSAGE_TYPES;
  };
}

/**
 * Functions used to intercept console methods and post the messages to
 * the parent window.
 *
 * TODO: Fix this: JSON.stringify([undefined]) -> "[null]", ha!
 *
 */
const CONSOLE_INTERCEPTOR_FUNCTIONS = `
const __interceptConsoleLog = (...value) => {
  window.parent.postMessage({
    message: JSON.stringify(value),
    source: "LOG",
  });
}

const __interceptConsoleInfo = (...value) => {
  window.parent.postMessage({
    message: JSON.stringify(value),
    source: "INFO",
  });
}

const __interceptConsoleWarn = (...value) => {
  window.parent.postMessage({
    message: JSON.stringify(value),
    source: "WARN",
  });
}

const __interceptConsoleError = (...value) => {
  window.parent.postMessage({
    message: JSON.stringify(value),
    source: "ERROR",
  });
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
  return Babel.transform(codeString, {
    presets: [
      "es2017",
      "react",
      ["typescript", { isTSX: true, allExtensions: true }],
    ],
  }).code;
};

/**
 * Get all imported dependencies from the DependencyCacheService.
 */
const fetchRequiredDependencies = async (
  dependencies: ReadonlyArray<string>,
) => {
  return Promise.all(
    dependencies.map(d => DependencyCacheService.getDependency(d)),
  );
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
 * NOTE: Including the code twice, once up top and once wrapped within the test
 * harness, seems necessary for the console to work. Not yet sure why...
 */
export const injectTestCode = (testCode: string) => (codeString: string) => {
  return `
  /* Via injectTestCode */
  ${codeString}
    {
      ${stripConsoleCalls(codeString)}
      ${getTestHarness(testCode)}
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
 * augment it later;
 */
export const getTestDependencies = (testLib: string): string => testLib;

/**
 * Get the test code string for a markup challenge.
 */
export const getTestHarness = (testCode: string): string => `
function buildTestsFromCode() {
    const arr = [];
    const test = (message, fn) => {
        arr.push({
            message,
            test: fn,
        })
    }

    ${testCode}

    return arr;
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
`;

/**
 * Put together the script tags necessary for running the tests in an iframe,
 * including the script that includes the tests themselves.
 */
export const getTestScripts = (testCode: string, testLib: string) => {
  return `
    <script id="test-dependencies">${getTestDependencies(testLib)}</script>
    <script id="test-code">${getTestHarness(testCode)}</script>
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
 * NOTE: createInjectDependenciesFunction returns an async function.
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

    // TODO: There's no reason for us to inject the test script in sandbox
    // mode, but the same applies to all challenge types so ideally we
    // would standardize the testing pipeline to the point where we could
    // include that logic in one place only.
    const sourceDocument = tidySource.replace(
      "</body>",
      `${testScript}</body>`,
    );

    return { code: sourceDocument, dependencies: [""] };
  } else {
    const { code: sourceCode, dependencies } = stripAndExtractModuleImports(
      sourceCodeString,
    );

    // this.addModuleTypeDefinitionsToMonaco(dependencies);

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
     * - Transform code with Babel
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
