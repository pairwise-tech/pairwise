// @ts-ignore
import SyntaxHighlightWorker from "workerize-loader!../tools/tsx-syntax-highlighter";

import React from "react";
import {
  ICodeEditorProps,
  ICodeEditor,
  ICodeEditorOptions,
  PAIRWISE_CODE_EDITOR_ID,
} from "./Workspace";
import {
  EXPRESS_JS_LIB_TYPES,
  TEST_EXPECTATION_LIB_TYPES,
} from "tools/browser-test-lib";
import {
  monaco,
  MonacoModel,
  registerExternalLib,
  USER_IMPORTED_TYPES_LIB_NAME,
} from "../monaco";
import Editor, { loader, OnMount } from "@monaco-editor/react";
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
const SUPPORTED_LIB_TYPE_DEFINITIONS = new Set([
  "react",
  "react-dom",
  "express",
]);

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
    // await this.initializeMonaco();
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

    const initializationPromise = loader
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

    const path = "file:///node_modules/@types";

    // Add type definitions for react and react-dom, for React challenges
    if (this.props.challengeType === "react") {
      // WHY!?
      mn.languages.typescript.typescriptDefaults.setCompilerOptions({
        jsx: "react",
        esModuleInterop: true,
      });

      mn.languages.typescript.typescriptDefaults.addExtraLib(
        REACT_D_TS,
        `${path}/react/index.d.ts`,
      );

      mn.languages.typescript.typescriptDefaults.addExtraLib(
        REACT_DOM_D_TS,
        `${path}/react-dom/index.d.ts`,
      );
    }

    // Add express-js lib type definitions for Backend module challenges
    if (this.props.isBackendModuleChallenge) {
      this.monacoWrapper.languages.typescript.typescriptDefaults.addExtraLib(
        EXPRESS_JS_LIB_TYPES,
        `${path}/express/index.d.ts`,
      );
    }

    // Add test expectation lib for Software Testing challenges
    if (this.props.isTestingAndAutomationChallenge) {
      this.monacoWrapper.languages.typescript.typescriptDefaults.addExtraLib(
        TEST_EXPECTATION_LIB_TYPES,
        `expectation-lib/index.d.ts`,
      );
    }

    // Markup challenges:
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

  editorOnMount: OnMount = (editor, monaco) => {
    console.log("editor on mount");
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

  handleEditorContentChange = (value: string | undefined) => {
    // const model = this.findModelByType("workspace-editor");
    // if (!model) {
    //   console.warn("No model found when editor content changed!");
    //   return;
    // }

    // const code = model.getValue();
    const code = value || "";

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

  addModuleTypeDefinitionsToMonaco = (packages: string[]) => {
    const defaultLib = "";

    const moduleDeclarations = packages
      // Filter out the library names we have added @types/ files for
      .filter(lib => !SUPPORTED_LIB_TYPE_DEFINITIONS.has(lib))
      .reduce(
        (declarations, name) => `${declarations}\ndeclare module "${name}";`,
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
    // return <div id={PAIRWISE_CODE_EDITOR_ID} style={{ height: "100%" }} />;

    return (
      <Editor
        options={{
          tabSize: 2,
          autoIndent: "full",
          formatOnPaste: true,
          automaticLayout: true,
          fixedOverflowWidgets: true,
          multiCursorModifier: "ctrlCmd",
          minimap: {
            enabled: false,
          },
        }}
        path="pairwise-monaco-editor.ts"
        value={this.props.value}
        onMount={this.editorOnMount}
        language={this.props.language}
        theme={MonacoEditorThemes.DEFAULT}
        onChange={this.handleEditorContentChange}
      />
    );
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
