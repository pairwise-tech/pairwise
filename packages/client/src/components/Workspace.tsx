// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import SyntaxHighlightWorker from "workerize-loader!../tools/tsx-syntax-highlighter";

import truncate from "truncate";
import { monaco, registerExternalLib, MonacoModel } from "../monaco";
import {
  assertUnreachable,
  Challenge,
  DataBlob,
  MonacoEditorThemes,
} from "@pairwise/common";
import { Console, Decode } from "console-feed";
import Modules, { ReduxStoreState } from "modules/root";
import React from "react";
import { Col, ColsWrapper, Row, RowsWrapper } from "react-grid-resizable";
import { connect } from "react-redux";
import { debounce } from "throttle-debounce";
import {
  requestCodeFormatting,
  subscribeCodeWorker,
  unsubscribeCodeWorker,
} from "../tools/code-worker";
import {
  COLORS as C,
  SANDBOX_ID,
  MONACO_EDITOR_FONT_SIZE_STEP,
} from "../tools/constants";
import { DIMENSIONS as D } from "../tools/dimensions";
import toaster from "tools/toast-utils";
import { types } from "../tools/jsx-types";
import {
  getMarkupForCodeChallenge,
  compileCodeString,
  IframeMessageEvent,
  IFRAME_MESSAGE_TYPES,
  getTestScripts,
  tidyHtml,
  TestCase,
} from "../tools/test-utils";
import ChallengeTestEditor from "./ChallengeTestEditor";
import MediaArea from "./MediaArea";
import { LowerRight, IconButton, UpperRight, Loading } from "./Shared";
import {
  Tooltip,
  ButtonGroup,
  Menu,
  MenuItem,
  Position,
  Popover,
  MenuDivider,
} from "@blueprintjs/core";
import { MonacoEditorOptions } from "modules/challenges/types";
import {
  wait,
  composeWithProps,
  constructDataBlobFromChallenge,
  challengeRequiresWorkspace,
  getFileMetaByChallengeType,
} from "tools/utils";
import {
  Tab,
  TabbedInnerNav,
  Container,
  PageSection,
  WorkspaceContainer,
  colSeparatorProps,
  rowSeparatorProps,
  ContentContainer,
  InstructionsViewEdit,
  ContentTitle,
  TestResultRow,
  Spacer,
  DragIgnorantFrameContainer,
  consoleRowStyles,
  LowerSection,
  RevealSolutionLabel,
  RunButton,
  TestStatusTextTab,
} from "./WorkspaceComponents";
import { ADMIN_TEST_TAB, ADMIN_EDITOR_TAB } from "modules/challenges/store";
import { EXPECTATION_LIB } from "tools/browser-test-lib";
import { CODEPRESS } from "tools/client-env";
import cx from "classnames";
import traverse from "traverse";
import GreatSuccess from "./GreatSuccess";
import pipe from "ramda/es/pipe";
import SEO from "./SEO";

const debug = require("debug")("client:Workspace");

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

const CODE_FORMAT_CHANNEL = "WORKSPACE_MAIN";

const PAIRWISE_CODE_EDITOR_ID = "pairwise-code-editor";

type ConsoleLogMethods = "warn" | "info" | "error" | "log";

// Given an iframe and the relevant code render it all as a script to the iframe's srcdoc
const getMarkupSrcdoc = (
  iframe: HTMLIFrameElement,
  code: string,
  testCode: string,
): string => {
  const testScript = getTestScripts(code, testCode, EXPECTATION_LIB);

  // NOTE: Tidy html should ensure there is indeed a closing body tag
  const tidySource = tidyHtml(code);

  // Just to give us some warning if we ever hit this. Should be impossible...
  if (!tidySource.includes("</body>")) {
    console.warn(
      "[Err] Could not append test code to closing body tag in markup challenge",
    );
  }

  // TODO: There's no reason for us to inject the test script in sandbox
  // mode, but the same applies to all challenge types so ideally we
  // would standardize the testing pipeline to the point where we could
  // include that logic in one place only.
  return tidySource.replace("</body>", `${testScript}</body>`);
};

interface Log {
  data: ReadonlyArray<string>;
  method: ConsoleLogMethods;
}

const DEFAULT_LOGS: ReadonlyArray<Log> = [
  {
    method: "info",
    data: ["console output will be rendered here:"],
  },
];

type MODEL_ID = string;
type MODEL_TYPE = "workspace-editor" | "jsx-types";
type ModelIdMap = Map<MODEL_TYPE, MODEL_ID>;

interface IState {
  code: string;
  testResultsLoading: boolean;
  testResults: ReadonlyArray<TestCase>; // TODO: This should no longer be necessary after testString is up and running
  monacoInitializationError: boolean;
  logs: ReadonlyArray<{ data: ReadonlyArray<any>; method: string }>;
  hideSuccessModal: boolean;
  workspaceEditorModelIdMap: ModelIdMap;
}

/** ===========================================================================
 * React Component
 * ============================================================================
 */

class Workspace extends React.Component<IProps, IState> {
  // Place to store user code when solution code is revealed
  userCode: string = "";

  syntaxWorker: any = null;

  // The wrapper class provided @monaco-editor/react. Confusingly,
  // monacoWrapper.editor is not the editor instance but a collection of static
  // methods and maybe a class as well. But they are different. Editor instance
  // is needed for updating editor options, i.e. font size.
  monacoWrapper: any = null;

  // A cancelable handler for refreshing the editor
  editorRefreshTimerHandler: Nullable<number> = null;

  // The actual monaco editor instance.
  editorInstance: Nullable<{
    updateOptions: (x: MonacoEditorOptions) => void;
  }> = null;

  iFrameRef: Nullable<HTMLIFrameElement> = null;
  debouncedSaveCodeFunction: () => void;
  debouncedRenderPreviewFunction: () => void;
  debouncedSyntaxHighlightFunction: (code: string) => void;

  initializationPromise: Nullable<Promise<void>> = null;

  constructor(props: IProps) {
    super(props);

    this.debouncedRenderPreviewFunction = debounce(200, this.runChallengeTests);

    this.debouncedSyntaxHighlightFunction = debounce(
      250,
      this.requestSyntaxHighlighting,
    );

    this.debouncedSaveCodeFunction = debounce(50, this.handleChangeEditorCode);

    // NOTE: Except for codepress edit mode this is the only touch point for
    // updating the code in the editor as of this commit. This means that to
    // update editor code the whole editor has to be re-initialized, which
    // in-turn means that the parent component has to ensure it's fully
    // re-initializing this component rather than just passing updated props. As
    // of right now this means that the various loading props need to be
    // accurate.
    const initialCode = "code" in props.blob ? props.blob.code : "";

    this.userCode = initialCode;

    this.state = {
      code: initialCode,
      testResults: [],
      logs: DEFAULT_LOGS,
      monacoInitializationError: false,

      // This is what allows the user to close the success modal since it's
      // otherwise based on passing test status.
      hideSuccessModal: true,

      testResultsLoading: false,

      // A map of the Monaco models the Workspace has created.
      workspaceEditorModelIdMap: new Map(),
    };
  }

  async componentDidMount() {
    document.addEventListener("keydown", this.handleKeyPress);
    window.addEventListener(
      "message",
      this.handleReceiveMessageFromCodeRunner,
      false,
    );

    /* Initialize Monaco Editor and the SyntaxHighlightWorker */
    await this.initializeMonaco();
    this.initializeSyntaxHighlightWorker();

    /* Handle some timing issue with Monaco initialization... */
    // TODO: This might cause issues with an unmounted editor. Needs to be made
    // cancellable.
    await wait(500);
    this.runChallengeTests();
    this.debouncedSyntaxHighlightFunction(this.state.code);

    subscribeCodeWorker(this.handleCodeFormatMessage);

    /* Focus the editor whenever a challenge is loaded */
    this.tryToFocusEditor();
  }

  componentWillUnmount() {
    this.cleanupEditor();
    window.removeEventListener("keydown", this.handleKeyPress);
    window.removeEventListener(
      "message",
      this.handleReceiveMessageFromCodeRunner,
    );
    unsubscribeCodeWorker(this.handleCodeFormatMessage);

    // Cancel any pending refresh
    if (this.editorRefreshTimerHandler) {
      clearTimeout(this.editorRefreshTimerHandler);
    }
  }

  componentDidUpdate(prevProps: IProps) {
    /**
     * Handle toggling the solution code on and off.
     */

    // Solution is toggled ON:
    if (!prevProps.revealSolutionCode && this.props.revealSolutionCode) {
      // Store the user code and set the solution code as the workspace
      // editor code string.
      this.userCode = this.state.code;
      this.setState(
        {
          code: this.props.challenge.solutionCode,
        },
        this.pauseAndRefreshEditor,
      );
    } else if (prevProps.revealSolutionCode && !this.props.revealSolutionCode) {
      // Solution is toggled OFF: Restore the user code in the workspace
      // editor.
      this.setState(
        {
          code: this.userCode,
        },
        this.pauseAndRefreshEditor,
      );
    }

    const fullScreenChange =
      prevProps.userSettings.fullScreenEditor !==
      this.props.userSettings.fullScreenEditor;
    const editViewChange =
      prevProps.editModeAlternativeViewEnabled !==
      this.props.editModeAlternativeViewEnabled;

    /**
     * Refresh the editor if the editor views are changed.
     */
    if (fullScreenChange || editViewChange) {
      this.refreshEditor();
    }

    // Handle changes in editor options
    if (prevProps.editorOptions !== this.props.editorOptions) {
      this.editorInstance?.updateOptions(this.props.editorOptions);
    }

    // Handle changes in the editor theme
    if (prevProps.userSettings.theme !== this.props.userSettings.theme) {
      debug(
        "[componentDidUpdate setting theme] (prev, next) (",
        prevProps.userSettings.theme,
        this.props.userSettings.theme,
        ")",
      );
      this.setMonacoEditorTheme(this.props.userSettings.theme);
    }

    // Handle changes to isEditMode. If this is a code challenge and isEditMode
    // has changed, then update.
    //
    // This update is currently necessary to get the correct code into the
    // editor when switching edit mode. For example: I'm in codepress but just
    // using the app as a user. I type some code in the editor, which gets
    // persisted.  I then switch to edit mode. At that point we need to replace
    // the editor code--which has changed--with the starter code so that I can
    // edit it.
    if (
      "code" in this.props.blob &&
      prevProps.isEditMode !== this.props.isEditMode
    ) {
      if (this.props.isEditMode) {
        // Switching TO edit mode FROM user mode
        this.handleEditorTabClick(this.props.adminEditorTab);
      } else {
        // Switching FROM edit mode TO user mode
        const userCode = this.props.blob.code || "";
        this.setState({ code: userCode }, this.refreshEditor);
      }
    }

    // Account for changing the challenge type in the sandbox. Otherwise nothing
    // gets re-rendered since the ID of the challenge does not change
    if (prevProps.challenge.type !== this.props.challenge.type) {
      this.pauseAndRefreshEditor();
    }
  }

  refreshEditor = async () => {
    await this.resetMonacoEditor();
    this.setMonacoEditorValue();
    if (this.iFrameRef) {
      this.runChallengeTests();
    }
  };

  tryToFocusEditor = () => {
    if (this.editorInstance) {
      // @ts-ignore .focus is a valid method...
      this.editorInstance.focus();
    }
  };

  /**
   * Reset the code editor content to the starterCode.
   */
  resetCodeWindow = () => {
    this.transformMonacoCode(() => this.props.challenge.starterCode);
  };

  initializeSyntaxHighlightWorker = () => {
    this.syntaxWorker = new SyntaxHighlightWorker();

    this.syntaxWorker.addEventListener("message", (event: any) => {
      debug("[syntax highlight incoming]", event);
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
    if (!this.monacoWrapper || this.props.challenge.type === "markup") {
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

    const language = this.getMonacoLanguageFromChallengeType();

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
    if (this.props.challenge.type === "markup") {
      workspaceEditorModel = mn.editor.createModel(this.state.code, language);
    } else {
      /* TypeScript and React challenges: */
      workspaceEditorModel = mn.editor.createModel(
        this.state.code,
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

    this.setMonacoEditorTheme(this.props.userSettings.theme);

    // Record the model ids for the two created models to track them.
    const workspaceEditorModelIdMap: ModelIdMap = new Map();
    workspaceEditorModelIdMap.set("workspace-editor", workspaceEditorModel.id);
    workspaceEditorModelIdMap.set("jsx-types", jsxTypesModel.id);

    this.setState({ workspaceEditorModelIdMap });

    debug("[initializeMonaco] Monaco editor initialized.");
  };

  getMonacoLanguageFromChallengeType = () => {
    const { type } = this.props.challenge;

    switch (type) {
      case "react":
      case "typescript":
        debug(`[getMonacoLanguageFromChallengeType] using "typescript"`);
        return "typescript";
      case "markup":
        debug(`[getMonacoLanguageFromChallengeType] using "html"`);
        return "html";
      default:
        console.warn(`[WARNING] Invalid challenge type for monaco: ${type}`);
        debug(`[getMonacoLanguageFromChallengeType] using "plaintext"`);
        return "plaintext";
    }
  };

  /**
   * Switching tabs in the main code area, so that we can edit the starter code
   * and solution code of a challenge.
   *
   * NOTE: When switching to the solution code default to the starter code.
   */
  handleEditorTabClick = async (tab: ADMIN_EDITOR_TAB) => {
    this.setState(
      {
        code: this.props.challenge[tab] || this.props.challenge.starterCode, // See NOTE
      },
      async () => {
        await this.refreshEditor();
        this.props.setAdminEditorTab(tab);
      },
    );
  };

  /**
   * Switch tabs in the test area of the workspace. So that we can see test
   * results and write tests using different tabs.
   */
  handleTestTabClick = async (tab: ADMIN_TEST_TAB) => {
    if (tab !== this.props.adminTestTab) {
      /**
       * NOTE: The reason for this additional logic is to "refresh" the test
       * results when one of us clicks back to the test results tab. That tab is
       * the only tab from the perspective of end users so this should only ever
       * happen when we are editing via codepress.
       */

      if (tab === "testResults") {
        await this.refreshEditor();
      }

      this.props.setAdminTestTab(tab);
    }
  };

  render() {
    const { correct: allTestsPassing } = this.getTestPassedStatus();
    const { testResults, testResultsLoading, hideSuccessModal } = this.state;
    const {
      challenge,
      isEditMode,
      userSettings,
      revealSolutionCode,
      editModeAlternativeViewEnabled,
    } = this.props;
    const { fullScreenEditor } = userSettings;

    const IS_ALTERNATIVE_EDIT_VIEW = editModeAlternativeViewEnabled;
    const IS_SANDBOX = challenge.id === SANDBOX_ID;
    const IS_FULLSCREEN = fullScreenEditor || IS_SANDBOX;
    const IS_REACT_CHALLENGE = challenge.type === "react";
    const IS_MARKUP_CHALLENGE = challenge.type === "markup";
    const IS_TYPESCRIPT_CHALLENGE = challenge.type === "typescript";
    const IS_GREAT_SUCCESS_OPEN =
      allTestsPassing &&
      !hideSuccessModal &&
      !isEditMode &&
      !revealSolutionCode;

    const handleCloseSuccessModal = () => {
      this.setState({ hideSuccessModal: true });
    };

    const WorkspaceTestContainer = (
      <>
        <TabbedInnerNav show={isEditMode}>
          <Tab
            onClick={() => this.handleTestTabClick("testResults")}
            active={this.props.adminTestTab === "testResults"}
          >
            Test Results
          </Tab>
          <Tab
            onClick={() => this.handleTestTabClick("testCode")}
            active={this.props.adminTestTab === "testCode"}
          >
            Test Code
          </Tab>
          {isEditMode && <TestStatusTextTab passing={allTestsPassing} />}
        </TabbedInnerNav>
        {this.props.isEditMode && this.props.adminTestTab === "testCode" ? (
          <ChallengeTestEditor />
        ) : (
          <ContentContainer>
            <ContentTitle style={{ marginBottom: 12 }}>
              {this.getTestSummaryString()}
            </ContentTitle>
            {testResults.map((x, i) => (
              <TestResultRow key={i} {...x} index={i} />
            ))}
            <Spacer height={50} />
          </ContentContainer>
        )}
      </>
    );

    const TestFullHeightEditor = (
      <Col style={consoleRowStyles} initialHeight={D.WORKSPACE_HEIGHT}>
        <>{IS_ALTERNATIVE_EDIT_VIEW && WorkspaceTestContainer}</>
        <div>
          {!IS_ALTERNATIVE_EDIT_VIEW && (
            <Console variant="dark" logs={this.state.logs} />
          )}
          <DragIgnorantFrameContainer
            id="iframe"
            title="code-preview"
            ref={this.setIframeRef}
            style={{ visibility: "hidden", height: 0, width: 0 }}
          />
        </div>
      </Col>
    );

    const MONACO_CONTAINER = (
      <div style={{ height: "100%", position: "relative" }}>
        <GreatSuccess
          challenge={challenge}
          isOpen={IS_GREAT_SUCCESS_OPEN}
          onClose={handleCloseSuccessModal}
          onClickOutside={handleCloseSuccessModal}
        />
        <TabbedInnerNav show={isEditMode}>
          <Tab
            onClick={() => this.handleEditorTabClick("starterCode")}
            active={this.props.adminEditorTab === "starterCode"}
          >
            Starter Code
          </Tab>
          <Tab
            onClick={() => this.handleEditorTabClick("solutionCode")}
            active={this.props.adminEditorTab === "solutionCode"}
          >
            Solution
          </Tab>
        </TabbedInnerNav>
        <UpperRight isEditMode={isEditMode}>
          {revealSolutionCode && (
            <RevealSolutionLabel
              hideSolution={this.props.handleToggleSolutionCode}
            />
          )}
          <Tooltip content="Shortcut: opt+enter" position="left">
            <RunButton
              icon="play"
              id="pw-run-code"
              loading={testResultsLoading}
              onClick={this.handleUserTriggeredTestRun}
              aria-label="run the current editor code"
            >
              Run
            </RunButton>
          </Tooltip>
        </UpperRight>
        <LowerRight>
          <ButtonGroup vertical>
            <Tooltip content="Increase Font Size" position="left">
              <IconButton
                icon="plus"
                aria-label="increase editor font size"
                onClick={this.props.increaseFontSize}
              />
            </Tooltip>
            <Tooltip content="Decrease Font Size" position="left">
              <IconButton
                icon="minus"
                aria-label="decrease editor font size"
                onClick={this.props.decreaseFontSize}
              />
            </Tooltip>
          </ButtonGroup>
          <div style={{ marginBottom: 8 }} />
          <Tooltip content="Format Code" position="left">
            <IconButton
              icon="clean"
              aria-label="format editor code"
              onClick={this.handleFormatCode}
            />
          </Tooltip>
          <div style={{ marginBottom: 8 }} />
          <Popover
            content={
              <Menu>
                {!IS_SANDBOX && isEditMode && (
                  <MenuItem
                    icon={
                      IS_ALTERNATIVE_EDIT_VIEW ? "application" : "applications"
                    }
                    text="Toggle Alternative Edit Mode"
                    aria-label="toggle alternative edit mode"
                    onClick={this.props.toggleAlternativeEditView}
                  />
                )}
                {!IS_SANDBOX && (
                  <MenuItem
                    icon={fullScreenEditor ? "collapse-all" : "expand-all"}
                    aria-label="toggle editor size"
                    onClick={this.props.toggleEditorSize}
                    text={
                      fullScreenEditor
                        ? "Regular Size Editor"
                        : "Full Screen Editor"
                    }
                  />
                )}
                <MenuItem
                  icon="contrast"
                  aria-label="toggle high contrast mode"
                  onClick={this.props.toggleHighContrastMode}
                  text="Toggle High Contrast Mode"
                />
                <MenuItem
                  icon="download"
                  aria-label="export as text"
                  onClick={this.handleExport}
                  text="Export File"
                />
                <MenuDivider />
                <MenuItem
                  icon="reset"
                  aria-label="reset editor"
                  onClick={this.resetCodeWindow}
                  text="Restore Initial Code"
                />
                {!IS_SANDBOX && (
                  <MenuItem
                    icon={revealSolutionCode ? "application" : "applications"}
                    aria-label={
                      revealSolutionCode
                        ? "hide solution code"
                        : "reveal solution code"
                    }
                    text={
                      revealSolutionCode
                        ? "Hide Solution Code"
                        : "Reveal Solution Code"
                    }
                    onClick={this.props.handleToggleSolutionCode}
                  />
                )}
              </Menu>
            }
            position={Position.LEFT_BOTTOM}
          >
            <Tooltip content="More options..." position="left">
              <IconButton aria-label="more options" icon="more" />
            </Tooltip>
          </Popover>
        </LowerRight>
        <div id={PAIRWISE_CODE_EDITOR_ID} style={{ height: "100%" }} />
      </div>
    );

    return (
      <Container>
        <PageSection>
          <WorkspaceContainer>
            <ColsWrapper separatorProps={colSeparatorProps}>
              <Col
                initialWidth={D.EDITOR_PANEL_WIDTH}
                initialHeight={D.WORKSPACE_HEIGHT}
              >
                {IS_FULLSCREEN || IS_ALTERNATIVE_EDIT_VIEW ? (
                  <div
                    style={{ height: "100%", background: C.BACKGROUND_CONSOLE }}
                  >
                    {MONACO_CONTAINER}
                  </div>
                ) : (
                  <RowsWrapper separatorProps={rowSeparatorProps}>
                    <Row
                      initialHeight={D.CHALLENGE_CONTENT_HEIGHT}
                      style={{ background: C.BACKGROUND_CONTENT }}
                    >
                      <ContentContainer>
                        <InstructionsViewEdit />
                      </ContentContainer>
                    </Row>
                    <Row
                      style={{ background: C.BACKGROUND_EDITOR }}
                      initialHeight={D.EDITOR_HEIGHT}
                    >
                      {MONACO_CONTAINER}
                    </Row>
                    <Row
                      initialHeight={D.TEST_CONTENT_HEIGHT}
                      style={{ background: C.BACKGROUND_CONTENT }}
                    >
                      {WorkspaceTestContainer}
                    </Row>
                  </RowsWrapper>
                )}
              </Col>
              {IS_ALTERNATIVE_EDIT_VIEW ? (
                TestFullHeightEditor
              ) : IS_REACT_CHALLENGE ? (
                <Col initialHeight={D.WORKSPACE_HEIGHT}>
                  <RowsWrapper separatorProps={rowSeparatorProps}>
                    <Row initialHeight={D.PREVIEW_HEIGHT}>
                      <div style={{ height: "100%" }}>
                        <DragIgnorantFrameContainer
                          id="iframe"
                          title="code-preview"
                          ref={this.setIframeRef}
                        />
                      </div>
                    </Row>
                    <Row
                      style={consoleRowStyles}
                      initialHeight={D.CONSOLE_HEIGHT}
                    >
                      <div>
                        <Console variant="dark" logs={this.state.logs} />
                      </div>
                    </Row>
                  </RowsWrapper>
                </Col>
              ) : IS_TYPESCRIPT_CHALLENGE ? (
                <Col
                  style={consoleRowStyles}
                  initialHeight={D.WORKSPACE_HEIGHT}
                >
                  <div>
                    <Console variant="dark" logs={this.state.logs} />
                    <DragIgnorantFrameContainer
                      id="iframe"
                      title="code-preview"
                      ref={this.setIframeRef}
                      style={{ visibility: "hidden", height: 0, width: 0 }}
                    />
                  </div>
                </Col>
              ) : IS_MARKUP_CHALLENGE ? (
                <Col initialHeight={D.WORKSPACE_HEIGHT}>
                  <div style={{ height: "100%" }}>
                    <DragIgnorantFrameContainer
                      id="iframe"
                      title="code-preview"
                      ref={this.setIframeRef}
                    />
                  </div>
                </Col>
              ) : (
                /* Handle other challenge types ~ */
                <div />
              )}
            </ColsWrapper>
          </WorkspaceContainer>
        </PageSection>
      </Container>
    );
  }

  getTestPassedStatus = () => {
    const { testResults, testResultsLoading } = this.state;
    const passedTests = testResults.filter(t => t.testResult);
    const correct =
      !testResultsLoading &&
      passedTests.length > 0 &&
      passedTests.length === testResults.length;
    return { correct, passedTests, testResults };
  };

  getTestSummaryString = () => {
    const { passedTests, testResults } = this.getTestPassedStatus();
    return `Tests: ${passedTests.length}/${testResults.length} Passed`;
  };

  setMonacoEditorValue = () => {
    const model = this.findModelByType("workspace-editor");
    if (model) {
      model.setValue(this.state.code);
    }
  };

  setMonacoEditorTheme = (theme: string) => {
    if (this.monacoWrapper) {
      debug("[setMonacoEditorTheme]", theme);
      this.monacoWrapper.editor.setTheme(theme);
      this.debouncedSyntaxHighlightFunction(this.state.code);
    } else {
      debug("[setMonacoEditorTheme]", "No editor pressent");
    }
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

  handleEditorContentChange = (_: any) => {
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
     * - Save the code to local storage (debounced)
     * - Render the iframe preview (debounced)
     */
    this.setState({ code }, () => {
      this.debouncedSaveCodeFunction();
      this.debouncedSyntaxHighlightFunction(code);

      /**
       * Only live preview markup challenges, for the UI.
       *
       * TODO: Revisit this for React challenges.
       */
      if (this.props.challenge.type === "markup") {
        this.debouncedRenderPreviewFunction();
      }
    });
  };

  handleChangeEditorCode = () => {
    if (this.props.isEditMode) {
      const { challenge } = this.props;
      this.props.updateChallenge({
        id: challenge.id,
        challenge: {
          [this.props.adminEditorTab]: this.state.code,
        },
      });

      // Do not store anything to local storage
      return;
    }

    /**
     * Construct a code blob for the current challenge and update this code
     * blob in local Redux state.
     */
    const blob = constructDataBlobFromChallenge({
      code: this.state.code,
      challenge: this.props.challenge,
    });

    this.props.updateCurrentChallengeBlob({
      dataBlob: blob,
      challengeId: this.props.challenge.id,
    });
  };

  handleReceiveMessageFromCodeRunner = (event: IframeMessageEvent) => {
    const handleLogMessage = (message: any, method: ConsoleLogMethods) => {
      const msg = JSON.parse(message);
      const data: ReadonlyArray<any> = [...msg];
      this.transformUnserializableLogs(data);
      this.updateWorkspaceConsole({ data, method });
    };

    try {
      const { source, message } = event.data;
      switch (source) {
        case IFRAME_MESSAGE_TYPES.LOG: {
          debug("[IFRAME_MESSAGE_TYPES.LOG]", message);
          return handleLogMessage(message, "log");
        }
        case IFRAME_MESSAGE_TYPES.INFO: {
          debug("[IFRAME_MESSAGE_TYPES.INFO]", message);
          return handleLogMessage(message, "info");
        }
        case IFRAME_MESSAGE_TYPES.WARN: {
          debug("[IFRAME_MESSAGE_TYPES.WARN]", message);
          return handleLogMessage(message, "warn");
        }
        case IFRAME_MESSAGE_TYPES.ERROR: {
          debug("[IFRAME_MESSAGE_TYPES.ERROR]", message);
          return handleLogMessage(message, "error");
        }
        case IFRAME_MESSAGE_TYPES.INFINITE_LOOP: {
          debug("[IFRAME_MESSAGE_TYPES.INFINITE_LOOP]", message);
          toaster.toast.clear(); /* Clear existing toasts */
          toaster.warn("Please check your code for infinite loops!");
          break;
        }
        case IFRAME_MESSAGE_TYPES.TEST_RESULTS: {
          debug("[IFRAME_MESSAGE_TYPES.TEST_RESULTS]", message);
          const results = JSON.parse(message);
          if (!Array.isArray(results)) {
            console.warn("[bad things]", results);
            break;
          }
          this.setState(
            { testResults: results, testResultsLoading: false },
            this.handleReceiveTestResults,
          );
          break;
        }
        case IFRAME_MESSAGE_TYPES.TEST_ERROR: {
          debug("[IFRAME_MESSAGE_TYPES.TEST_ERROR]", message);
          console.warn(
            "[ERR] Something went wrong with the tests:",
            source,
            message,
          );
          this.setState({ testResultsLoading: false });
          break;
        }
        default: {
          assertUnreachable(source);
        }
      }
    } catch (err) {
      // no-op
      // This is currently a noop because it's super noisy in dev. The
      // assertUnreachable throws all the time because of something. Looks like
      // react devtools is putting a message through and that's hitting the
      // default case.
    }
  };

  handleReceiveTestResults = () => {
    const { correct } = this.getTestPassedStatus();
    /**
     * This is called with the results of the test and can be used to trigger
     * various events at this time such as displaying the challenge success
     * modal (if passed), and updating the user progress map to show challenge
     * completed / attempted feedback in the challenge navigation map.
     *
     * Only fire if user has changed code in the editor, thus establishing
     * their intent to attempt the challenge. This will correctly ignore
     * Workspace initiated test runs on challenge load.
     */
    if (this.state.code !== this.props.challenge.starterCode) {
      this.props.handleAttemptChallenge({
        challengeId: this.props.challenge.id,
        complete: correct,
      });
    } else {
      debug(
        "[INFO] Starter code not changed. Not firing handleAttemptChallenge.",
      );
    }
  };

  iframeRenderPreview = async (): Promise<void> => {
    if (!this.iFrameRef || !this.iFrameRef.contentWindow) {
      console.warn("[iframe] Not yet mounted");
      return;
    }

    // Process the code string and create an HTML document to render
    // to the iframe.
    try {
      // Should give some searchable text should we encounter this.
      let sourceDocument = "<!-- SHOULD_BE_OVERWRITTEN -->";

      if (this.props.challenge.type === "markup") {
        sourceDocument = getMarkupSrcdoc(
          this.iFrameRef,
          this.state.code,
          this.props.challenge.testCode,
        );
      } else {
        const code = await this.compileAndTransformCodeString();
        sourceDocument = getMarkupForCodeChallenge(code, EXPECTATION_LIB);
      }

      this.iFrameRef.srcdoc = sourceDocument;
    } catch (err) {
      this.handleCompilationError(err);
    }
  };

  /**
   * The tests run automatically in other scenarios, but this method
   * handles the "user triggered" test executions and other events
   * which should accompany the user triggered test runs, such as
   * showing the success modal.
   *
   * Currently, the user can only run the tests using opt+enter
   * key combination or by clicking the Run button.
   */
  handleUserTriggeredTestRun = () => {
    this.setState({ hideSuccessModal: false });
    this.runChallengeTests();
  };

  // NOTE We manage the false loading state where test results are received. The
  // iframeRenderPreview method only puts the tests into the DOM where they will
  // automatically run, but if we were to use that promise to set
  // testResultsLoading to false we would run into cases where the tests hadn't
  // finished running yet.
  runChallengeTests = async () => {
    this.setState(
      {
        logs: DEFAULT_LOGS,
        testResultsLoading: true, // See NOTE
      },
      this.iframeRenderPreview,
    );
  };

  compileAndTransformCodeString = async () => {
    const { code, dependencies } = await compileCodeString(
      this.state.code,
      this.props.challenge,
    );

    this.addModuleTypeDefinitionsToMonaco(dependencies);

    return code;
  };

  handleCompilationError = (error: Error) => {
    debug("[handleCompilationError]", error);
    const log = Decode([
      {
        method: "error",
        data: [error.message],
      },
    ]);
    this.updateWorkspaceConsole(log);
    this.setState({ testResultsLoading: false });
  };

  updateWorkspaceConsole = (log: Log) => {
    this.setState(
      ({ logs }) => ({
        logs: [...logs, log],
      }),
      () => {
        const { method, data } = log;
        const message = data;

        /**
         * Send logs directly to the browser console as well. This feature
         * could be toggled on or off, or just on by default.
         */
        switch (method) {
          case "log":
            return console.log(...message);
          case "info":
            return console.info(message);
          case "warn":
            return console.warn(message);
          case "error":
            return console.error(message);
          default:
            assertUnreachable(method);
        }
      },
    );
  };

  /**
   * This method handles transforming log messages passed from the
   * iframe to the parent window. When we pass the iframe's log messages
   * through `postMessage`, we first serialize them, and in doing so, we
   * are inadvertently replacing certain non-serializable values with "null"
   * (such as `undefined` and `NaN`). To overcome this, we pass a replacer
   * function to JSON.stringify, which replaces every instance of these
   * values with "whitelisted" transform strings. Here, we're recursively
   * traversing the data object searching for these whitelisted strings and
   * replacing them with their corresponding values, thus preserving the
   * original logs.
   */
  transformUnserializableLogs = (data: ReadonlyArray<any>) => {
    traverse(data).forEach(function(x) {
      if (x === "__transform_undefined__") {
        this.update(undefined);
        return;
      }
      if (x === "__transform_NaN__") {
        this.update(NaN);
        return;
      }
      if (x === "__transform_Infinity__") {
        this.update(Infinity);
        return;
      }
      if (typeof x === "string" && x.startsWith("__transform_symbol_from:")) {
        const symbolFrom = x.split(":")[1];
        this.update(Symbol(symbolFrom));
        return;
      }
    });
  };

  handleKeyPress = (event: KeyboardEvent) => {
    /**
     * I like Cmd+Enter but this produces a new line in the editor...so I
     * just used Opt+Enter for now. We can try to fix this later, anyway
     * it will need to be revisited if we want to fully support
     * Windows shortcut keys.
     */
    const OptionAndEnterKey = event.altKey && event.key === "Enter";
    if (OptionAndEnterKey) {
      this.handleUserTriggeredTestRun();
    }
  };

  resetMonacoEditor = async () => {
    this.cleanupEditor();
    await this.initializeMonaco();
    await this.initializeMonacoEditor();
  };

  setIframeRef = (ref: HTMLIFrameElement) => {
    this.iFrameRef = ref;
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

  /**
   * Cleanup monaco editor resources
   */
  private readonly cleanupEditor = () => {
    this.disposeModels();
    this.editorInstance = null;
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

  /**
   * Run the auto formatter on the code in the code window. This replaces the code currently present.
   * NOTE: An incoming message is fired when the worker is ready, so we can't
   * assume there is code coming over the wire.
   */
  private readonly handleCodeFormatMessage = (event: MessageEvent) => {
    const code = event.data?.code;
    const channel = event.data?.channel;
    if (code && channel === CODE_FORMAT_CHANNEL) {
      this.transformMonacoCode(() => code);
    } else {
      console.warn("[INFO] No code passed via message event", event);
    }
  };

  // Export / Download the text from the editor as a file. File extension is determined by challenge type.
  private readonly handleExport = () => {
    const { code } = this.state;
    const meta = getFileMetaByChallengeType(this.props.challenge.type);

    if (!meta) {
      console.warn(
        `[WARN] Cannot get file meta data for inappropriate challenge type: ${this.props.challenge.type}`,
      );
      return;
    }

    const filename = `${meta.name}.${meta.ext}`;
    const DOWNLOAD_LINK_ID = "pairwise-blob-download-link";
    const data = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(data); // NOTE: We never revoke any object URLs. Potential future improvement, but likely not a bottleneck

    try {
      let link: Nullable<HTMLAnchorElement> = document.querySelector(
        `a#${DOWNLOAD_LINK_ID}`,
      );

      // We create the download link initially and then just reuse it on
      // subsequent uses. Not sure if actually appending to the dom is necessary,
      // just worried some brwosers migth not allow a click on an element that
      // couldn't realistically be clicked since it's not in the DOM
      if (!link) {
        link = document.createElement("a");
        link.id = DOWNLOAD_LINK_ID;
        link.style.display = "none";
        link.textContent = "Click to download";
        document.body.appendChild(link); // See NOTE
      }

      // This is how to set the name of the file which will be saved to the users computer
      link.download = filename;
      link.href = url;
      link.click();
    } catch (err) {
      toaster.error(
        `There was an error downloading the file. Sorry! The team will be
        notified. As a workaround you can copy the text in the editor and
        manually paste it into an empty file and save it with the filename
        "${filename}".

        If you're unsure where to save the file try pasting into TextEdit (Mac)
        or Notepad (Windows). Linux users you probably already know what you're
        doing.`,
      );
    }
  };

  private readonly handleFormatCode = () => {
    try {
      requestCodeFormatting({
        code: this.state.code,
        type: this.props.challenge.type,
        channel: CODE_FORMAT_CHANNEL,
      });
    } catch (err) {
      console.warn("[INFO] Could not post to code worker", err);
    }
  };

  private readonly transformMonacoCode = (fn: (x: string) => string) => {
    this.setState({ code: fn(this.state.code) }, this.setMonacoEditorValue);
  };

  private readonly pauseAndRefreshEditor = async (timeout: number = 50) => {
    // Be sure to cancel any in-flight timeout before setting up a new one
    if (this.editorRefreshTimerHandler) {
      debug(
        "[WARN pauseAndRefreshEditor] Refresh already in progress. Ignoring.",
      );
      clearTimeout(this.editorRefreshTimerHandler);
    }

    this.editorRefreshTimerHandler = setTimeout(this.refreshEditor, timeout);
  };
}

/** ===========================================================================
 * Props
 * ============================================================================
 */

const ChallengeSelectors = Modules.selectors.challenges;
const ChallengeActions = Modules.actions.challenges;

const mapStateToProps = (state: ReduxStoreState) => ({
  isEditMode: ChallengeSelectors.isEditMode(state),
  isUserLoading: Modules.selectors.user.loading(state),
  isLoadingBlob: ChallengeSelectors.isLoadingBlob(state),
  challenge: ChallengeSelectors.getCurrentChallenge(state),
  userSettings: Modules.selectors.user.userSettings(state),
  editorOptions: Modules.selectors.user.editorOptions(state),
  blob: ChallengeSelectors.getBlobForCurrentChallenge(state),
  showMediaArea: ChallengeSelectors.getHasMediaContent(state),
  adminTestTab: ChallengeSelectors.adminTestTabSelector(state),
  revealSolutionCode: ChallengeSelectors.revealSolutionCode(state),
  adminEditorTab: ChallengeSelectors.adminEditorTabSelector(state),
  editModeAlternativeViewEnabled: ChallengeSelectors.editModeAlternativeViewEnabled(
    state,
  ),
});

const dispatchProps = {
  setAdminTestTab: ChallengeActions.setAdminTestTab,
  setAdminEditorTab: ChallengeActions.setAdminEditorTab,
  updateChallenge: ChallengeActions.updateChallenge,
  updateUserSettings: Modules.actions.user.updateUserSettings,
  handleAttemptChallenge: ChallengeActions.handleAttemptChallenge,
  toggleRevealSolutionCode: ChallengeActions.toggleRevealSolutionCode,
  updateCurrentChallengeBlob: ChallengeActions.updateCurrentChallengeBlob,
  toggleAlternativeEditView:
    Modules.actions.challenges.toggleEditModeAlternativeView,
};

const mergeProps = (
  state: ReturnType<typeof mapStateToProps>,
  methods: typeof dispatchProps,
  props: {},
) => ({
  ...props,
  ...methods,
  ...state,
  toggleHighContrastMode: () => {
    const nextTheme =
      state.userSettings.theme === MonacoEditorThemes.DEFAULT
        ? MonacoEditorThemes.HIGH_CONTRAST
        : MonacoEditorThemes.DEFAULT;
    methods.updateUserSettings({ theme: nextTheme });
  },
  toggleEditorSize: () => {
    methods.updateUserSettings({
      fullScreenEditor: !state.userSettings.fullScreenEditor,
    });
  },
  increaseFontSize: () => {
    methods.updateUserSettings({
      workspaceFontSize:
        state.editorOptions.fontSize + MONACO_EDITOR_FONT_SIZE_STEP,
    });
  },
  decreaseFontSize: () => {
    methods.updateUserSettings({
      workspaceFontSize:
        state.editorOptions.fontSize - MONACO_EDITOR_FONT_SIZE_STEP,
    });
  },
  handleToggleSolutionCode: () => {
    methods.toggleRevealSolutionCode({
      shouldReveal: !state.revealSolutionCode,
    });
  },
});

type ConnectProps = ReturnType<typeof mergeProps>;

interface IProps extends ConnectProps {
  blob: DataBlob;
  challenge: Challenge;
}

const withProps = connect(mapStateToProps, dispatchProps, mergeProps);

/** ===========================================================================
 * WorkspaceLoadingContainer
 * ----------------------------------------------------------------------------
 * - A container component to wait for a challenge and blob to be fully
 * initialized before rendering the Workspace, which requires a challenge to
 * exist.
 * ============================================================================
 */

class WorkspaceLoadingContainer extends React.Component<ConnectProps, {}> {
  render() {
    const { challenge, blob, isLoadingBlob, isUserLoading } = this.props;

    if (!challenge || isLoadingBlob || isUserLoading) {
      return (
        <div style={{ marginTop: 150 }}>
          <Loading />
        </div>
      );
    }

    /**
     * If the code blob does not exist (the APIs will return 404 if it does not
     * exist yet), construct a new code blob for this challenge which uses the
     * starter code for the challenge itself.
     */
    const constructedBlob = constructDataBlobFromChallenge({
      challenge,
      code: challenge.starterCode,
    });
    const codeBlob = blob ? blob : constructedBlob;
    const isSandbox = challenge.id === SANDBOX_ID;
    const requiresWorkspace = challengeRequiresWorkspace(challenge);
    const seoMeta = {
      title: challenge.title,
      description: getSeoExcerpt(challenge),
    };

    return (
      <React.Fragment>
        <SEO {...seoMeta} />
        {requiresWorkspace && (
          <Workspace {...this.props} blob={codeBlob} challenge={challenge} />
        )}
        {!isSandbox && (CODEPRESS || this.props.showMediaArea) && (
          <LowerSection withHeader={challenge.type === "media"}>
            <MediaArea />
          </LowerSection>
        )}
      </React.Fragment>
    );
  }
}

const stripChars = (s: string) => {
  return s.replace(/\n/g, ". ").replace(/[^A-Za-z0-9 ,."'!?]/g, "");
};

const getSeoExcerpt = pipe(
  (x: Challenge) => x.instructions || x.content || x.title,
  stripChars,
  (x: string) => truncate(x, 150),
);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default composeWithProps<{}>(withProps)(WorkspaceLoadingContainer);
