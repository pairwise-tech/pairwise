import * as Babel from "@babel/standalone";

import { Challenge } from "modules/challenges/types";
import { getTestCodeReact, getTestCodeTypeScript } from "./challenges";
import DependencyCacheService from "./module-service";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

/**
 * Functions used to intercept console methods and post the messages to
 * the parent window.
 */
const CONSOLE_INTERCEPTOR_FUNCTIONS = `
const __interceptConsoleLog = (value) => {
  window.parent.postMessage({
    message: JSON.stringify(value),
    source: "LOG",
  });
}

const __interceptConsoleInfo = (value) => {
  window.parent.postMessage({
    message: JSON.stringify(value),
    source: "INFO",
  });
}

const __interceptConsoleWarn = (value) => {
  window.parent.postMessage({
    message: JSON.stringify(value),
    source: "WARN",
  });
}

const __interceptConsoleError = (value) => {
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
export const removeConsole = (codeString: string) => {
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
  dependencies: ReadonlyArray<string>,
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
  dependencies: ReadonlyArray<string>,
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
 */
export const injectTestCode = (challenge: Challenge) => (
  codeString: string,
) => {
  const { type, testCode } = challenge;
  const testCodeInjectionFunction =
    type === "react" ? getTestCodeReact : getTestCodeTypeScript;

  return `
    ${codeString}
    {
      ${removeConsole(codeString)}
      ${testCodeInjectionFunction(JSON.parse(testCode))}
    }
  `;
};

/**
 * Get the full html content string for the iframe, injected the user code
 * into it. This currently includes script libraries now.
 */
export const getMarkupForCodeChallenge = (scriptString: string) => `
<html>
  <head></head>
  <body>
    <div id="root" />
    <script>${scriptString}</script>
  </body>
</html>
`;
