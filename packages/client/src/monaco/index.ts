import { monaco as Monaco } from "@monaco-editor/react";
import * as MonacoEditor from "monaco-editor/esm/vs/editor/editor.api";

// Quicker reference type for the Monaco model
export type MonacoModel = MonacoEditor.editor.ITextModel;

/**
 * Unique name to identify injected type definitions for user imported
 * modules.
 */
export const USER_IMPORTED_TYPES_LIB_NAME = "imported-user-module-types";

// Name is optional, but recommended. The case where we don't use the name is
// where the external lib is dynamic. Currently this is the case with stripping
// out module imports and adding a definition for each of them. Just to make the
// code type check. It's not like we get actual definitions for the modules.
interface ExternalLibrary {
  name?: string;
  source: string;
}

// Libs placed here should be universal to all monaco editors in the app. For
// specific libs, such as for the testing editor, use the register helper below
const libs: ExternalLibrary[] = [
  {
    name: "monaco-type-patches.d.ts",
    // eslint-disable-next-line
    // @ts-ignore
    source: require("!raw-loader!./monaco-type-patches.d.ts"),
  },
];

// Uses lib source content to identify if a lib has been added yet.
const addedLibs = new Set<string>();

// Libs only need to be added once.
const addExtraLibs = (mn: typeof MonacoEditor) => {
  libs
    .filter(lib => !addedLibs.has(lib.source))
    .forEach(lib => {
      /**
       * Do not cache user imported module type definitions, they can change
       * between challenges and will need to be updated again.
       */
      if (lib.name !== USER_IMPORTED_TYPES_LIB_NAME) {
        addedLibs.add(lib.source);
      }
      mn.languages.typescript.typescriptDefaults.addExtraLib(
        lib.source,
        lib.name ? `ts:filename/${lib.name}` : undefined,
      );
      mn.languages.typescript.javascriptDefaults.addExtraLib(
        lib.source,
        lib.name ? `ts:filename/${lib.name}` : undefined,
      );
    });

  return mn;
};

const initializePairwiseMonaco = (): Promise<typeof MonacoEditor> => {
  return Monaco.init()
    .then(addExtraLibs)
    .catch(err => {
      const message = "[Monaco Lib Error] Could not add extra libs";
      console.error(message);

      // If this fails due to our code try loading up the editor anyway.
      // NOTE: This might be not be a great idea. My thinking is that it would be
      // better for the user if the editor loaded up anyway without additional
      // libs, but maybe it would just break the experience if not tha app since
      // certain things wouldn't type check.
      return Monaco.init();
    });
};

export const registerExternalLib = (lib: ExternalLibrary) => {
  libs.push(lib);
  initializePairwiseMonaco();
};

// Wrap the Monaco object so that initialization includes the extra lib helper
// but is still invoked by calling code, rather than invoking immediately here.
export const monaco = new Proxy(Monaco, {
  get: (obj: typeof Monaco, prop: "init" | "config") => {
    if (prop === "init") {
      return initializePairwiseMonaco;
    } else {
      return obj[prop];
    }
  },
});

export { ControlledEditor } from "@monaco-editor/react";
