// @ts-ignore
import SyntaxHighlightWorker from "workerize-loader!../tools/tsx-syntax-highlighter";

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
import { editor } from "monaco-editor";
import { CHALLENGE_TEST_EDITOR } from "./ChallengeTestEditor";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

const PAIRWISE_MONACO_EDITOR = "pairwise-monaco-editor.tsx";

// This id is used to apply .tsx syntax highlighting styles for
// the Monaco editor. The styles are found in monaco-tsx-styles.scss.
const PAIRWISE_EDITOR_ID = "pairwise-code-editor";

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

class WorkspaceMonacoEditor
  extends React.Component<ICodeEditorProps, IState>
  implements ICodeEditor
{
  monaco: Nullable<Monaco> = null;

  syntaxWorker: any = null;

  debouncedSyntaxHighlightFunction: (code: string) => void;

  state: IState = {
    workspaceEditorModelIdMap: new Map(),
  };

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

    // Pause briefly before dispatching syntax highlighting request
    await wait(250);

    this.debouncedSyntaxHighlightFunction(this.props.value);
  }

  componentDidUpdate(nextProps: ICodeEditorProps) {
    // Apply workspace lib if edit mode is enabled
    if (nextProps.isEditMode && this.monaco) {
      const root = "file:///node_modules/@types";
      const getPath = (name: string) => `${root}/${name}/index.d.ts`;
      this.monaco.languages.typescript.typescriptDefaults.addExtraLib(
        WORKSPACE_LIB_TYPES,
        getPath("pairwise-workspace"),
      );
    }
  }

  editorOnMount: OnMount = (editor, monaco) => {
    const model = editor.getModel();
    if (model) {
      const workspaceEditorModelIdMap: ModelIdMap = new Map();
      workspaceEditorModelIdMap.set(PAIRWISE_MONACO_EDITOR, model.id);
      this.setState({ workspaceEditorModelIdMap });
    }

    const root = "file:///node_modules/@types";
    const getPath = (name: string) => `${root}/${name}/index.d.ts`;

    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      MONACO_TYPE_PATCHES,
      getPath("monaco-type-patches"),
    );

    if (this.props.isEditMode) {
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        WORKSPACE_LIB_TYPES,
        getPath("pairwise-workspace"),
      );
    }

    if (this.props.isBackendModuleChallenge) {
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        EXPRESS_JS_LIB_TYPES,
        getPath("express"),
      );
    }

    if (this.props.isTestingAndAutomationChallenge) {
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        TEST_EXPECTATION_LIB_TYPES,
        getPath("expectation-lib"),
      );
    }

    if (this.props.challengeType === "react") {
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        jsx: 2,
        noEmit: true,
        allowNonTsExtensions: true,
        allowSyntheticDefaultImports: true,
        target: monaco.languages.typescript.ScriptTarget.ES2016,
      });

      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        REACT_D_TS,
        getPath("react"),
      );

      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        REACT_DOM_D_TS,
        getPath("react-dom"),
      );
    }

    if (this.props.isReactNativeChallenge) {
      // TODO: Create a better type declaration
      const REACT_NATIVE_D_TS = `declare module "react-native" {
        declare const View: any;
        declare const Text: any;
        declare const Button: any;
        declare const TextInput: any;
        declare const Switch: any;
        declare const FlatList: any;
        declare const ScrollView: any;
        declare const Touchable: any;
        declare const TouchableOpacity: any;
      }`;

      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        REACT_NATIVE_D_TS,
        getPath("react-native-web"),
      );
    }

    this.monaco = monaco;

    editor.focus();
  };

  render() {
    return (
      <div id={PAIRWISE_EDITOR_ID} style={{ height: "100%" }}>
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
    if (this.props.challengeType === "react") {
      if (this.syntaxWorker) {
        this.syntaxWorker.postMessage({ code });
      }
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

    const decorations = classifications.map((c) => {
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
