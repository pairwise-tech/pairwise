import axios from "axios";
import toaster from "./toast-utils";

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
  [key: string]: Module_Source;
}

interface ModuleDefinition {
  default: string;
}

type Module_Source = string | ModuleDefinition;

const IS_TEST = process.env.NODE_ENV === "test";

/** ===========================================================================
 * Handle External Libraries
 * ============================================================================
 */

let ReactNativeWebSourceUrl: Module_Source = "";

/**
 * Not very ideal, but Jest has some issues with the file-loader! Fine!
 */
if (IS_TEST) {
  // eslint-disable-next-line
  const fs = require("fs");
  const lib = fs.readFileSync("src/js/react-native-web-lib.js", {
    encoding: "utf8",
  });
  ReactNativeWebSourceUrl = { default: lib };
} else {
  /**
   * NOTE: This source file is a Webpack-bundled version of the react-native-web
   * library. This is produced using the code in this repo:
   *
   * https://github.com/pairwise-tech/react-native-web-library
   *
   * The bundled output is then copied in the file which is imported here. To
   * update this source code, the bundle will need to be regenerated using that
   * helper repo and copied over here.
   */
  // eslint-disable-next-line
  // @ts-ignore
  ReactNativeWebSourceUrl = require("!!raw-loader!../js/react-native-web-lib.js");
}

const SOURCE_LIBRARY_MAP: SourceLibraryMap = {
  "react-native": ReactNativeWebSourceUrl,
  react: "https://unpkg.com/react@17/umd/react.development.js",
  "react-dom": "https://unpkg.com/react-dom@17/umd/react-dom.development.js",
  "react-dom-test-utils":
    "https://unpkg.com/react-dom@17/umd/react-dom-test-utils.development.js",
};

/** ===========================================================================
 * Module Caching Service
 * ----------------------------------------------------------------------------
 * - This service is responsible for fetching and caching npm dependencies
 * for workspace challenges.
 * ============================================================================
 */

class DependencyCacheClass {
  sourceLibraries = new Map();
  dependencyCache: DependencyCache = new Map();

  constructor(sourceLibraryMap: SourceLibraryMap) {
    this.sourceLibraries = new Map(Object.entries(sourceLibraryMap));
  }

  getDependency = async (packageName: string): Promise<string> => {
    if (this.dependencyCache.has(packageName)) {
      // The package is cached just return the code:
      const dependency = this.dependencyCache.get(packageName) as Dependency;
      return dependency.source;
    } else {
      if (this.sourceLibraries.has(packageName)) {
        try {
          // Get the source library:
          const resolver = this.sourceLibraries.get(packageName);
          let lib = "";

          if (typeof resolver === "string") {
            lib = await this.fetchResource(resolver);
          } else {
            lib = resolver.default;
          }

          this.dependencyCache.set(packageName, { source: lib });
          return lib;
        } catch (err) {
          const msg = `[ERROR]: Failed to fetch source for ${packageName}. Error message: ${err.message}`;
          console.error(msg);
          toaster.warn(`Failed to fetch imported dependency: ${packageName}`);
          return "";
        }
      } else {
        console.warn(`No source library exists for package: ${packageName}`);
        return "";
      }
    }
  };

  fetchResource = async (uri: string) => {
    const response = await axios.get(uri, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });

    return response.data;
  };
}

/** ===========================================================================
 * Export
 * ============================================================================
 */

const DependencyCacheService = new DependencyCacheClass(SOURCE_LIBRARY_MAP);

export default DependencyCacheService;
