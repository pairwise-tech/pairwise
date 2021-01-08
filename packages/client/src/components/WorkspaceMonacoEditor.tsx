// @ts-ignore
import SyntaxHighlightWorker from "workerize-loader!../tools/tsx-syntax-highlighter";

import React from "react";
import {
  ICodeEditorProps,
  ICodeEditor,
  ICodeEditorOptions,
  PAIRWISE_CODE_EDITOR_ID,
} from "./Workspace";
import { TEST_EXPECTATION_LIB_TYPES } from "tools/browser-test-lib";
import {
  monaco,
  MonacoModel,
  registerExternalLib,
  USER_IMPORTED_TYPES_LIB_NAME,
} from "../monaco";
import { MonacoEditorThemes } from "@pairwise/common";
import cx from "classnames";
import { wait } from "tools/utils";
import { debounce } from "throttle-debounce";
import { MonacoEditorOptions } from "modules/challenges/types";
import { IDisposable } from "monaco-editor";

/**
 * NOTE: The following imports external library @types/ type definitions.
 * To add more in the future, find the source file and add it following the
 * same pattern as below for react and react-dom. These libraries are
 * added to monaco using the addExtraLib method (see below in the monaco
 * initialization code).
 *
 * Note also that in the case of the @types/react library, I manually
 * added other imported reference into the file we import here.
 */

// eslint-disable-next-line
const REACT_D_TS = require("!raw-loader!../monaco/react.d.ts");
// eslint-disable-next-line
const REACT_DOM_D_TS = require("!raw-loader!../monaco/react-dom.d.ts");

// The above type definitions are supported
const SUPPORTED_LIB_TYPE_DEFINITIONS = new Set(["react", "react-dom"]);

type MODEL_ID = string;
type MODEL_TYPE = "workspace-editor" | "jsx-types";
type ModelIdMap = Map<MODEL_TYPE, MODEL_ID>;

interface IState {
  workspaceEditorModelIdMap: ModelIdMap;
  monacoInitializationError: boolean;
}

export default class WorkspaceMonacoEditor
  extends React.Component<ICodeEditorProps, IState>
  implements ICodeEditor {
  // The wrapper class provided @monaco-editor/react. Confusingly,
  // monacoWrapper.editor is not the editor instance but a collection of static
  // methods and maybe a class as well. But they are different. Editor instance
  // is needed for updating editor options, i.e. font size.
  monacoWrapper: any = null;

  onBlurDisposable: Nullable<IDisposable> = null;

  syntaxWorker: any = null;

  // The actual monaco editor instance.
  editorInstance: Nullable<{
    updateOptions: (x: MonacoEditorOptions) => void;
    focus(): void;
    onDidBlurEditorText(fn: () => void): IDisposable;
  }> = null;

  initializationPromise: Nullable<Promise<void>> = null;

  state: IState = {
    // A map of the Monaco models the Workspace has created.
    workspaceEditorModelIdMap: new Map(),
    monacoInitializationError: false,
  };

  debouncedSyntaxHighlightFunction: (code: string) => void;

  private _isMounted = false;

  constructor(props: ICodeEditorProps) {
    super(props);
    this.debouncedSyntaxHighlightFunction = debounce(
      250,
      this.requestSyntaxHighlighting,
    );
  }

  async componentDidMount() {
    this._isMounted = true;
    /* Initialize Monaco Editor and the SyntaxHighlightWorker */
    await this.initializeMonaco();
    this.initializeSyntaxHighlightWorker();

    /* Handle some timing issue with Monaco initialization... */
    await wait(500);

    this.debouncedSyntaxHighlightFunction(this.props.value);
  }

  componentDidUpdate() {
    const currentValue = this.getMonacoEditorValue();
    const nextValue = this.props.value;
    if (currentValue !== nextValue) {
      this.setMonacoEditorValue();
    }
  }

  componentWillUnmount() {
    this.cleanup();
    this._isMounted = false;
  }

  updateOptions = (options: ICodeEditorOptions) => {
    this.editorInstance?.updateOptions(options);
  };

  initializeMonaco = async (): Promise<void> => {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    const initializationPromise = monaco
      .init()
      .then(mn => {
        mn.languages.typescript.typescriptDefaults.setCompilerOptions({
          strict: true,
          noEmit: true,
          esModuleInterop: true,
          jsx: mn.languages.typescript.JsxEmit.React,
          typeRoots: ["node_modules/@types"],
          allowNonTsExtensions: true,
          target: mn.languages.typescript.ScriptTarget.ES2017,
          module: mn.languages.typescript.ModuleKind.CommonJS,
          moduleResolution: mn.languages.typescript.ModuleResolutionKind.NodeJs,
        });

        mn.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
          noSyntaxValidation: false,
          noSemanticValidation: false,
        });

        this.monacoWrapper = mn;

        return this.initializeMonacoEditor();
      })
      .catch(error => {
        console.error(
          "An error occurred during initialization of Monaco: ",
          error,
        );
        this.setState({ monacoInitializationError: true });
      });

    this.initializationPromise = initializationPromise;

    return initializationPromise;
  };

  initializeMonacoEditor = async (): Promise<void> => {
    if (!this.monacoWrapper) {
      console.warn(
        "[ERROR initializeMonacoEditor] Called before monaco was initialized!",
      );
    }

    const mn = this.monacoWrapper;

    const language = this.props.language;

    const options = {
      theme: MonacoEditorThemes.DEFAULT,
      automaticLayout: true,
      tabSize: 2,
      autoIndent: true,
      formatOnPaste: true,
      fixedOverflowWidgets: true,
      multiCursorModifier: "ctrlCmd",
      minimap: {
        enabled: false,
      },
      ...this.props.editorOptions,
    };

    let workspaceEditorModel;

    // Add type definitions for react and react-dom, for React challenges
    if (this.props.challengeType === "react") {
      // WHY!?
      mn.languages.typescript.typescriptDefaults.setCompilerOptions({
        esModuleInterop: true,
        jsx: "react",
      });

      const path = "file:///node_modules/@types";

      mn.languages.typescript.typescriptDefaults.addExtraLib(
        REACT_D_TS,
        `${path}/react/index.d.ts`,
      );

      mn.languages.typescript.typescriptDefaults.addExtraLib(
        REACT_DOM_D_TS,
        `${path}/react-dom/index.d.ts`,
      );
    }

    /* Markup challenges: */
    if (this.props.challengeType === "markup") {
      workspaceEditorModel = mn.editor.createModel(this.props.value, language);
    } else {
      // TypeScript and React challenges:
      workspaceEditorModel = mn.editor.createModel(
        this.props.value,
        language,
        mn.Uri.parse("file:///main.tsx"),
      );
    }

    workspaceEditorModel.onDidChangeContent(this.handleEditorContentChange);

    this.editorInstance = mn.editor.create(
      document.getElementById(PAIRWISE_CODE_EDITOR_ID),
      {
        ...options,
        model: workspaceEditorModel,
      },
    );

    if (this.editorInstance) {
      this.setTheme(this.props.userSettings.theme);

      // Add handler for auto-formatting text on editor blur
      this.onBlurDisposable = this.editorInstance.onDidBlurEditorText(
        this.props.onDidBlurEditorText,
      );
    }

    // Record the model ids for the two created models to track them.
    const workspaceEditorModelIdMap: ModelIdMap = new Map();
    workspaceEditorModelIdMap.set("workspace-editor", workspaceEditorModel.id);

    if (this._isMounted) {
      this.setState({ workspaceEditorModelIdMap });
    } else {
      console.warn(
        "[initializeMonaco] Already unmounted. Will not set workspaceEditorModelIdMap...",
      );
    }

    // Call parent callback to trigger any events on Monaco initialization
    this.props.onDidInitializeMonacoEditor();
  };

  setTheme = (theme: string) => {
    if (this.monacoWrapper) {
      this.monacoWrapper.editor.setTheme(theme);
      this.debouncedSyntaxHighlightFunction(this.props.value);
    }
  };

  focus = () => {
    this.editorInstance?.focus();
  };

  refresh = async () => {
    this.cleanup();
    await this.initializeMonaco();
    await this.initializeMonacoEditor();
  };

  handleEditorContentChange = () => {
    const model = this.findModelByType("workspace-editor");
    if (!model) {
      console.warn("No model found when editor content changed!");
      return;
    }

    const code = model.getValue();

    /**
     * Update the stored code value and then dispatch the syntax
     * highlighting worker
     */
    this.props.onChange(code);

    this.debouncedSyntaxHighlightFunction(code);
  };

  resetMonacoEditor = async () => {
    this.cleanup();
    await this.initializeMonaco();
    await this.initializeMonacoEditor();
  };

  refreshEditor = async () => {
    await this.resetMonacoEditor();
    this.setMonacoEditorValue();
  };

  addModuleTypeDefinitionsToMonaco = (
    packages: string[],
    isTestingAndAutomationChallenge: boolean,
  ) => {
    /**
     * TODO: Fetch @types/ package type definitions if they exist or fallback
     * to the module declaration.
     *
     * See this:
     * https://github.com/codesandbox/codesandbox-client/blob/master/packages/app/src/embed/components/Content/Monaco/workers/fetch-dependency-typings.js
     *
     * If the challenge is a testing/automation challenge we add the Jest-style
     * expectation library as well. Otherwise, the default lib is empty.
     */
    const defaultLib = isTestingAndAutomationChallenge
      ? `\n${TEST_EXPECTATION_LIB_TYPES}\n`
      : "";

    const moduleDeclarations = packages
      // Filter out the library names we have added @types/ files for
      .filter(lib => SUPPORTED_LIB_TYPE_DEFINITIONS.has(lib))
      .reduce(
        (typeDefs, name) => `${typeDefs}\ndeclare module "${name}";`,
        defaultLib,
      );

    if (this.monacoWrapper) {
      registerExternalLib({
        source: moduleDeclarations,
        name: USER_IMPORTED_TYPES_LIB_NAME,
      });
    }
  };

  requestSyntaxHighlighting = (code: string) => {
    if (this.syntaxWorker) {
      this.syntaxWorker.postMessage({ code });
    }
  };

  // Called after this.props.value changes??
  setMonacoEditorValue = () => {
    const model = this.findModelByType("workspace-editor");
    if (model) {
      model.setValue(this.props.value);
    }
  };

  initializeSyntaxHighlightWorker = () => {
    this.syntaxWorker = new SyntaxHighlightWorker();

    this.syntaxWorker.addEventListener("message", (event: any) => {
      const { classifications, identifier } = event.data;
      if (classifications && identifier) {
        // Recognize message identifier sent from the worker
        if (identifier === "TSX_SYNTAX_HIGHLIGHTER") {
          requestAnimationFrame(() => {
            this.updateSyntaxDecorations(classifications);
          });
        }
      }
    });
  };

  readonly cleanup = () => {
    this.disposeModels();
    this.editorInstance = null;

    if (this.onBlurDisposable) {
      this.onBlurDisposable.dispose();
    }
  };

  updateSyntaxDecorations = async (classifications: ReadonlyArray<any>) => {
    if (!this.monacoWrapper || this.props.challengeType === "markup") {
      return;
    }

    const decorations = classifications.map(c => {
      /**
       * NOTE: Custom classNames to allow custom styling for the
       * editor theme:
       */
      const inlineClassName = cx(
        c.type ? `${c.kind} ${c.type}-of-${c.parentKind}` : c.kind,
        {
          highContrast:
            this.props.userSettings.theme === MonacoEditorThemes.HIGH_CONTRAST,
        },
      );

      return {
        range: new this.monacoWrapper.Range(
          c.startLine,
          c.start,
          c.endLine,
          c.end,
        ),
        options: {
          inlineClassName,
        },
      };
    });

    const model = this.findModelByType("workspace-editor");

    // prevent exception when moving through challenges quickly
    if (model) {
      // @ts-ignore I think decorations exist.
      const existing = model.decorations;
      // @ts-ignore I think decorations exist.
      model.decorations = model.deltaDecorations(existing || [], decorations);
    }
  };

  render() {
    return <div id={PAIRWISE_CODE_EDITOR_ID} style={{ height: "100%" }} />;
  }

  private readonly getMonacoEditorValue = () => {
    const model = this.findModelByType("workspace-editor");
    if (model) {
      return model.getValue();
    }
  };

  private readonly disposeModels = () => {
    const { workspaceEditorModelIdMap } = this.state;
    const workspaceModelIds = new Set(workspaceEditorModelIdMap.values());
    const remainingModelIds = new Map(workspaceEditorModelIdMap);

    if (this.monacoWrapper) {
      const models = this.monacoWrapper.editor.getModels();
      for (const model of models) {
        if (workspaceModelIds.has(model.id)) {
          model.dispose();
          remainingModelIds.delete(model.id);
        }
      }
    }

    /**
     * I'm not sure if it matters that we update the tracked model
     * ids and remove the removed ones... but anyway it happens.
     */
    this.setState({ workspaceEditorModelIdMap: remainingModelIds });
  };

  private readonly findModelByType = (
    type: MODEL_TYPE,
  ): Nullable<MonacoModel> => {
    const { workspaceEditorModelIdMap } = this.state;
    const modelId = workspaceEditorModelIdMap.get(type);

    if (this.monacoWrapper) {
      const models = this.monacoWrapper.editor.getModels();
      const model = models.find((m: MonacoModel) => m.id === modelId);
      if (model) {
        return model;
      }
    }

    return null;
  };
}
