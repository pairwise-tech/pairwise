import React from "react";
import { ICodeEditorProps, ICodeEditor } from "./Workspace";
import {
  EXPRESS_JS_LIB_TYPES,
  MONACO_TYPE_PATCHES,
  TEST_EXPECTATION_LIB_TYPES,
  WORKSPACE_LIB_TYPES,
  REACT_D_TS,
  REACT_DOM_D_TS,
} from "tools/browser-libraries";
import Editor, { Monaco, OnMount } from "@monaco-editor/react";
import { MonacoEditorThemes } from "@pairwise/common";
import cx from "classnames";
import { wait } from "tools/utils";
import { debounce } from "throttle-debounce";
import { editor, IDisposable } from "monaco-editor";

// @ts-ignore
import SyntaxHighlightWorker from "workerize-loader!../tools/tsx-syntax-highlighter";
import { CHALLENGE_TEST_EDITOR } from "./ChallengeTestEditor";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

const PAIRWISE_MONACO_EDITOR = "pairwise-monaco-editor.tsx";

type MODEL_ID = string;
type MODEL_TYPE = typeof CHALLENGE_TEST_EDITOR | typeof PAIRWISE_MONACO_EDITOR;
type ModelIdMap = Map<MODEL_TYPE, MODEL_ID>;

interface IState {
  workspaceEditorModelIdMap: ModelIdMap;
}

/** ===========================================================================
 * WorkspaceMonacoEditor
 * ============================================================================
 */

class WorkspaceMonacoEditor extends React.Component<ICodeEditorProps, IState>
  implements ICodeEditor {
  monaco: Nullable<Monaco> = null;

  onBlurDisposable: Nullable<IDisposable> = null;

  syntaxWorker: any = null;

  state: IState = {
    workspaceEditorModelIdMap: new Map(),
  };

  debouncedSyntaxHighlightFunction: (code: string) => void;

  constructor(props: ICodeEditorProps) {
    super(props);
    this.debouncedSyntaxHighlightFunction = debounce(
      250,
      this.requestSyntaxHighlighting,
    );
  }

  async componentDidMount() {
    /* Initialize Monaco Editor and the SyntaxHighlightWorker */
    this.initializeSyntaxHighlightWorker();

    /* Handle some timing issue with Monaco initialization... */
    await wait(500);

    this.debouncedSyntaxHighlightFunction(this.props.value);
  }

  editorOnMount: OnMount = (editor, monaco) => {
    const model = editor.getModel();
    if (model) {
      const workspaceEditorModelIdMap: ModelIdMap = new Map();
      workspaceEditorModelIdMap.set(PAIRWISE_MONACO_EDITOR, model.id);
      this.setState({ workspaceEditorModelIdMap });
    }

    this.handleAddExtraLibs(monaco);

    this.monaco = monaco;

    editor.focus();
  };

  handleAddExtraLibs = (monaco: Monaco) => {
    const handleAddExtraLib = (types: string, name: string) => {
      const root = "file:///node_modules/@types";
      const path = `${root}/${name}/index.d.ts`;
      const { addExtraLib } = monaco.languages.typescript.typescriptDefaults;
      addExtraLib(types, path);
    };

    handleAddExtraLib(MONACO_TYPE_PATCHES, "monaco-type-patches");

    if (this.props.isEditMode) {
      handleAddExtraLib(WORKSPACE_LIB_TYPES, "pairwise-workspace");
    }

    if (this.props.isBackendModuleChallenge) {
      handleAddExtraLib(EXPRESS_JS_LIB_TYPES, "express");
    }

    if (this.props.isTestingAndAutomationChallenge) {
      handleAddExtraLib(TEST_EXPECTATION_LIB_TYPES, "expectation-lib");
    }

    if (this.props.challengeType === "react") {
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        jsx: 2,
        noEmit: true,
        target: monaco.languages.typescript.ScriptTarget.ES2016,
        allowNonTsExtensions: true,
        allowSyntheticDefaultImports: true,
      });

      handleAddExtraLib(REACT_D_TS, "react");
      handleAddExtraLib(REACT_DOM_D_TS, "react-dom");
    }
  };

  render() {
    return (
      <div id="pairwise-code-editor" style={{ height: "100%" }}>
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
            ...this.props.editorOptions,
          }}
          path={PAIRWISE_MONACO_EDITOR}
          value={this.props.value}
          onMount={this.editorOnMount}
          language={this.props.language}
          theme={this.props.userSettings.theme}
          onChange={this.handleEditorContentChange}
        />
      </div>
    );
  }

  handleEditorContentChange = (value: string | undefined) => {
    const code = value || "";
    this.props.onChange(code);
    this.debouncedSyntaxHighlightFunction(code);
  };

  requestSyntaxHighlighting = (code: string) => {
    if (this.syntaxWorker) {
      this.syntaxWorker.postMessage({ code });
    }
  };

  initializeSyntaxHighlightWorker = () => {
    this.syntaxWorker = new SyntaxHighlightWorker();

    this.syntaxWorker.addEventListener("message", (event: any) => {
      const { classifications, identifier } = event.data;
      if (classifications && identifier) {
        if (identifier === "TSX_SYNTAX_HIGHLIGHTER") {
          requestAnimationFrame(() => {
            this.updateSyntaxDecorations(classifications);
          });
        }
      }
    });
  };

  updateSyntaxDecorations = async (classifications: ReadonlyArray<any>) => {
    const monaco = this.monaco;
    if (!monaco || this.props.challengeType === "markup") {
      return;
    }
    const decorations = classifications.map(c => {
      // Custom class names which are styled in the monaco-tsx-styles file
      const inlineClassName = cx(
        c.type ? `${c.kind} ${c.type}-of-${c.parentKind}` : c.kind,
        {
          highContrast:
            this.props.userSettings.theme === MonacoEditorThemes.HIGH_CONTRAST,
        },
      );
      return {
        range: new monaco.Range(c.startLine, c.start, c.endLine, c.end),
        options: {
          inlineClassName,
        },
      };
    });

    const model = this.findModelByType(PAIRWISE_MONACO_EDITOR);
    // prevent exception when moving through challenges quickly
    if (model) {
      // @ts-ignore I think decorations exist.
      const existing = model.decorations;
      // @ts-ignore I think decorations exist.
      model.decorations = model.deltaDecorations(existing || [], decorations);
    }
  };

  private readonly findModelByType = (
    type: MODEL_TYPE,
  ): Nullable<editor.ITextModel> => {
    const { workspaceEditorModelIdMap } = this.state;
    const modelId = workspaceEditorModelIdMap.get(type);

    if (this.monaco) {
      const models = this.monaco.editor.getModels();
      const model = models.find((m: editor.ITextModel) => m.id === modelId);
      if (model) {
        return model;
      }
    }

    return null;
  };
}

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default WorkspaceMonacoEditor;
