import axios from "axios";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface Dependency {
  source: string;
  typeDef?: string;
}

type DependencyCache = Map<string, Dependency>;

/**
 * TODO: Find a way to derive this file URLs dynamically from the package
 * name... I'm not sure how to do this as they can be arbitrarily placed
 * within a package and there is no canonical way to find the source file.
 *
 * However, we could just hard code these now for any libraries used within
 * the curriculum. It doesn't make very much sense for people to import other
 * libraries within the workspace itself, and anyway some error/warning could
 * be provided if they tried to do that.
 */
const CDN_PACKAGE_LINKS = {
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
  cdnLinks = new Map(Object.entries(CDN_PACKAGE_LINKS));

  getDependency = async (packageName: string) => {
    if (this.dependencies.has(packageName)) {
      /**
       * The package is cached just return the code.
       */
      const dependency = this.dependencies.get(packageName) as Dependency;
      return dependency.source;
    } else {
      if (this.cdnLinks.has(packageName)) {
        try {
          /**
           * TODO: Find a way to fetch the type definitions as well. Or,
           * hard code them in the CDN_PACKAGE_LINKS constant and just use
           * the values there.
           */
          const uri = this.cdnLinks.get(packageName) as string;
          const response = await axios.get(uri, {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          });
          const source = response.data;
          this.dependencies.set(packageName, { source });
          return source;
        } catch (err) {
          throw new Error(
            `Could not find dependency source for package ${packageName}`,
          );
        }
      }
    }
  };
}

/** ===========================================================================
 * Export
 * ============================================================================
 */

const DependencyCacheService = new DependencyCacheClass();

export default DependencyCacheService;
