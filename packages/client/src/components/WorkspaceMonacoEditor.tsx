// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import SyntaxHighlightWorker from "workerize-loader!../tools/tsx-syntax-highlighter";

import React from "react";
import {
  ICodeEditorProps,
  ICodeEditor,
  ICodeEditorOptions,
  PAIRWISE_CODE_EDITOR_ID,
} from "./Workspace";
import { monaco, registerExternalLib, MonacoModel } from "../monaco";
import { MonacoEditorThemes } from "@pairwise/common";
import cx from "classnames";
import { wait, pp } from "tools/utils";
import { debounce } from "throttle-debounce";
import { MonacoEditorOptions } from "modules/challenges/types";
import { types } from "tools/jsx-types";

const debug = require("debug")("client:WorkspaceMonacoEditor");

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

  syntaxWorker: any = null;

  // The actual monaco editor instance.
  editorInstance: Nullable<{
    updateOptions: (x: MonacoEditorOptions) => void;
    focus(): void;
  }> = null;

  initializationPromise: Nullable<Promise<void>> = null;

  state: IState = {
    // A map of the Monaco models the Workspace has created.
    workspaceEditorModelIdMap: new Map(),
    monacoInitializationError: false,
  };

  debouncedSyntaxHighlightFunction: (code: string) => void;

  constructor(props: ICodeEditorProps) {
    super(props);
    this.debouncedSyntaxHighlightFunction = debounce(
      250,
      this.requestSyntaxHighlighting,
    );
  }

  updateOptions = (options: ICodeEditorOptions) => {
    this.editorInstance?.updateOptions(options);
  };

  initializeMonaco = async (): Promise<void> => {
    if (this.initializationPromise) {
      debug("[initializeMonaco] Monaco already initialized, skipping.");
      return this.initializationPromise;
    }

    debug("[initializeMonaco] Monaco initializing...");

    const initializationPromise = monaco
      .init()
      .then(mn => {
        mn.languages.typescript.typescriptDefaults.setCompilerOptions({
          strict: true,
          noEmit: true,
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

        debug("[initializeMonaco] Monaco initialized. Initializing editor...");
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
      debug(
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

    /* Markup challenges: */
    if (this.props.challengeType === "markup") {
      workspaceEditorModel = mn.editor.createModel(this.props.value, language);
    } else {
      /* TypeScript and React challenges: */
      workspaceEditorModel = mn.editor.createModel(
        this.props.value,
        language,
        new mn.Uri.parse("file:///main.tsx"),
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

    /**
     * This is a separate model which provides JSX type information. See
     * this for more details: https://github.com/cancerberoSgx/jsx-alone/blob/master/jsx-explorer/HOWTO_JSX_MONACO.md.
     */
    const jsxTypesModel = mn.editor.createModel(
      types,
      "typescript",
      mn.Uri.parse("file:///index.d.ts"),
    );

    if (this.editorInstance) {
      this.setTheme(this.props.userSettings.theme);
    }

    // Record the model ids for the two created models to track them.
    const workspaceEditorModelIdMap: ModelIdMap = new Map();
    workspaceEditorModelIdMap.set("workspace-editor", workspaceEditorModel.id);
    workspaceEditorModelIdMap.set("jsx-types", jsxTypesModel.id);

    this.setState({ workspaceEditorModelIdMap });

    debug("[initializeMonaco] Monaco editor initialized.");
  };

  setTheme = (theme: string) => {
    if (this.monacoWrapper) {
      debug("[setMonacoEditorTheme]", theme);
      this.monacoWrapper.editor.setTheme(theme);
      this.debouncedSyntaxHighlightFunction(this.props.value);
    } else {
      debug("[setMonacoEditorTheme]", "No editor pressent");
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

  initialize = async () => {
    // TODO
  };

  handleEditorContentChange = () => {
    const model = this.findModelByType("workspace-editor");
    if (!model) {
      console.warn("No model found when editor content changed!");
      return;
    }

    const code = model.getValue();

    /**
     * Update the stored code value and then:
     *
     * - Dispatch the syntax highlighting worker
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

  addModuleTypeDefinitionsToMonaco = (packages: ReadonlyArray<string> = []) => {
    /**
     * TODO: Fetch @types/ package type definitions if they exist or fallback
     * to the module declaration.
     *
     * See this:
     * https://github.com/codesandbox/codesandbox-client/blob/master/packages/app/src/embed/components/Content/Monaco/workers/fetch-dependency-typings.js
     */
    const moduleDeclarations = packages.reduce(
      (typeDefs, name) => `${typeDefs}\ndeclare module "${name}";`,
      "",
    );

    if (this.monacoWrapper) {
      registerExternalLib({
        source: moduleDeclarations,
      });
    }
  };

  requestSyntaxHighlighting = (code: string) => {
    if (this.syntaxWorker) {
      debug("request syntax highlighting");
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
      debug("[syntax highlight incoming]", event);
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

  componentWillUnmount() {
    this.cleanup();
  }

  render() {
    return <div id={PAIRWISE_CODE_EDITOR_ID} style={{ height: "100%" }} />;
  }

  componentDidUpdate() {
    const currentValue = this.getMonacoEditorValue();
    const nextValue = this.props.value;
    debug("componetDidUpdate", currentValue, nextValue);
    if (currentValue !== nextValue) {
      this.setMonacoEditorValue();
    }
  }

  async componentDidMount() {
    /* Initialize Monaco Editor and the SyntaxHighlightWorker */
    await this.initializeMonaco();
    this.initializeSyntaxHighlightWorker();

    /* Handle some timing issue with Monaco initialization... */
    // TODO: This might cause issues with an unmounted editor. Needs to be made
    // cancellable.
    await wait(500);

    this.debouncedSyntaxHighlightFunction(this.props.value);
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
