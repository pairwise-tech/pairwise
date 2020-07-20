import axios from "axios";

/** ===========================================================================
 * External Libraries
 * ============================================================================
 */

const IS_TEST = process.env.NODE_ENV === "test";

let ReactNativeWebSourceUrl = "";

/**
 * Not very ideal, but Jest has some issues with the file-loader! Fine!
 */
if (IS_TEST) {
  const fs = require("fs");
  ReactNativeWebSourceUrl = fs.readFileSync("src/js/react-native-web-lib.js", {
    encoding: "utf8",
  });
} else {
  // @ts-ignore
  // eslint-disable-next-line import/no-webpack-loader-syntax
  ReactNativeWebSourceUrl = require("file-loader!../js/react-native-web-lib.js");
}

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface Dependency {
  source: string;
  typeDef?: string;
}

type DependencyCache = Map<string, Dependency>;

interface SourceLibraryMap {
  [key: string]: string;
}

/**
 * However, we could just hard code these now for any libraries used within
 * the curriculum. It doesn't make very much sense for people to import other
 * libraries within the workspace itself, and anyway some error/warning could
 * be provided if they tried to do that.
 */
const SOURCE_LIBRARY_MAP: SourceLibraryMap = {
  "react-native-web": ReactNativeWebSourceUrl,
  react: "https://unpkg.com/react@16/umd/react.development.js",
  "react-dom": "https://unpkg.com/react-dom@16/umd/react-dom.development.js",
  "react-dom-test-utils":
    "https://unpkg.com/react-dom@16.12.0/umd/react-dom-test-utils.development.js",
};

/** ===========================================================================
 * Module Caching Service
 * ----------------------------------------------------------------------------
 * - This service is responsible for fetching and caching npm dependencies
 * for workspace challenges.
 * ============================================================================
 */

class DependencyCacheClass {
  dependencies: DependencyCache = new Map();
  sourceLibraries = new Map();

  constructor(sourceLibraryMap: SourceLibraryMap) {
    this.sourceLibraries = new Map(Object.entries(sourceLibraryMap));
  }

  getDependency = async (packageName: string) => {
    if (this.dependencies.has(packageName)) {
      /**
       * The package is cached just return the code.
       */
      const dependency = this.dependencies.get(packageName) as Dependency;
      return dependency.source;
    } else {
      if (this.sourceLibraries.has(packageName)) {
        try {
          // Get the source library:
          const uri = this.sourceLibraries.get(packageName) as string;
          const source = await this.fetchResource(uri);
          this.dependencies.set(packageName, { source });
          return source;
        } catch (err) {
          const msg = `[ERROR]: Failed to fetch source for ${packageName}. Error: ${err.message}`;
          console.log(msg);
          throw new Error(msg);
        }
      }
    }
  };

  fetchResource = async (uri: string) => {
    try {
      /**
       * If it's not a URL we are in test mode and it's the actual source
       * file... this will throw and the source is returned. Yolo!
       */
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const url = new URL(uri);
      /**
       * NOTE: Sometimes these requests to unpkg can fail!
       *
       * We should review this later and try to make this more robust.
       * Currently, the Cypress test for React challenges is disabled
       * for this very reason.
       */
      const response = await axios.get(uri, {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
      return response.data;
    } catch (err) {
      return uri;
    }
  };
}

/** ===========================================================================
 * Export
 * ============================================================================
 */

const DependencyCacheService = new DependencyCacheClass(SOURCE_LIBRARY_MAP);

export default DependencyCacheService;
