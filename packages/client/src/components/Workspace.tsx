import truncate from "truncate";
import {
  assertUnreachable,
  Challenge,
  DataBlob,
  MonacoEditorThemes,
  CHALLENGE_TYPE,
  UserSettings,
} from "@pairwise/common";
import { Console, Decode } from "console-feed";
import Modules, { ReduxStoreState } from "modules/root";
import React from "react";
import {
  Col,
  ColsWrapper,
  Row,
  RowsWrapper,
} from "../js/react-grid-resizable/index.js";
import { connect } from "react-redux";
import { debounce } from "throttle-debounce";
import MobileDeviceUI, { MobileDevicePreviewType } from "./MobileDevicePreview";
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
import { getDimensions } from "../tools/dimensions";
import toaster from "tools/toast-utils";
import {
  getMarkupForCodeChallenge,
  compileCodeString,
  IframeMessageEvent,
  IFRAME_MESSAGE_TYPES,
  TestCase,
  getMarkupSrcDocument,
  buildPreviewTestResultsFromCode,
} from "../tools/test-utils";
import ChallengeTestEditor from "./ChallengeTestEditor";
import MediaArea from "./MediaArea";
import {
  LowerRight,
  IconButton,
  CodeEditorUpperRight,
  Loading,
  CodeEditorContainer,
} from "./SharedComponents";
import {
  ButtonGroup,
  Menu,
  MenuItem,
  Position,
  MenuDivider,
  Button,
} from "@blueprintjs/core";
import { Tooltip2, Popover2 } from "@blueprintjs/popover2";
import {
  composeWithProps,
  constructDataBlobFromChallenge,
  challengeRequiresWorkspace,
  getFileExtensionByChallengeType,
  wait,
  isAlternateLanguageChallenge,
  copyToClipboard,
} from "tools/utils";
import {
  Tab,
  TabbedInnerNav,
  Container,
  PageSection,
  WorkspaceContainer,
  getColSeparatorProps,
  getRowSeparatorProps,
  ContentContainer,
  InstructionsViewEdit,
  ContentTitle,
  TestResultRow,
  Spacer,
  DragIgnorantFrameContainer,
  getConsoleRowStyles,
  EmptyPreviewCoverPanel,
  RevealSolutionLabel,
  RunButton,
  TestStatusTextTab,
  LowerSection,
  WorkspaceMobileView,
  SQLResultsTable,
  INSTRUCTIONS_VIEW_PANEL_ID,
} from "./WorkspaceComponents";
import { ADMIN_TEST_TAB, ADMIN_EDITOR_TAB } from "modules/challenges/store";
import { WORKSPACE_LIB, EXPRESS_JS_LIB } from "tools/browser-libraries";
import { CODEPRESS } from "tools/client-env";
import traverse from "traverse";
import GreatSuccess from "./GreatSuccess";
import pipe from "ramda/es/pipe";
import partition from "ramda/es/partition";
import SEO from "./SEO";
import WorkspaceMonacoEditor from "./WorkspaceMonacoEditor";
import WorkspaceCodemirrorEditor from "./WorkspaceCodemirrorEditor";
import isMobile from "is-mobile";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

const CODE_FORMAT_CHANNEL = "WORKSPACE_MAIN_EDITOR";

export const MOBILE_SCROLL_PANEL_ID = "mobile-scroll-panel";

type ConsoleLogMethods = "warn" | "info" | "error" | "log";

interface Log {
  data: ReadonlyArray<string>;
  method: ConsoleLogMethods;
}

const DEFAULT_LOGS: ReadonlyArray<Log> = [
  {
    method: "info",
    data: ["log output will be rendered here:"],
  },
];

interface IState {
  code: string;
  hideSuccessModal: boolean;
  testResultsLoading: boolean;
  shouldRefreshLayout: boolean;
  isPreviewTestResults: boolean;
  monacoInitializationError: boolean;
  testResults: ReadonlyArray<TestCase>;
  dimensions: ReturnType<typeof getDimensions>;
  mobileDevicePreviewType: MobileDevicePreviewType;
  logs: ReadonlyArray<{ data: ReadonlyArray<any>; method: string }>;
}

export interface ICodeEditorOptions {
  fontSize: number;
}

export interface ICodeEditorProps {
  value: string;
  language: string;
  isEditMode: boolean;
  onChange: (x: string) => void;
  userSettings: UserSettings;
  challengeType: CHALLENGE_TYPE;
  editorOptions: ICodeEditorOptions;
  onDidBlurEditorText: () => void;
  isReactNativeChallenge: boolean;
  isBackendModuleChallenge: boolean;
  isTestingAndAutomationChallenge: boolean;
}

export interface ICodeEditor extends React.Component<ICodeEditorProps> {}

/** ===========================================================================
 * React Component
 * ============================================================================
 */

class Workspace extends React.Component<IProps, IState> {
  // Place to store user code when solution code is revealed
  userCode = "";

  // A cancelable handler for refreshing the editor
  editorRefreshTimerHandler: Nullable<NodeJS.Timeout> = null;

  // A cancellation time for the tests/preview process
  testCancellationTimer: Nullable<NodeJS.Timeout> = null;

  iFrameRef: Nullable<HTMLIFrameElement> = null;
  debouncedSaveCodeFunction: () => void;
  debouncedRenderPreviewFunction: () => void;

  // Resize the workspace in response to the window resizing. If this happens
  // it's probably because a mobile user goes from portrait to landscape.
  private readonly handleWindowResize = debounce(300, async (e: UIEvent) => {
    this.setState({
      dimensions: getDimensions(window.innerWidth, window.innerHeight),
    });
    this.refreshGridLayout();

    // The code editor needs to refresh before the iframe, otherwise the iframe
    // goes blank.
    //
    // This could turn into memory leak city, since we're de-bouncing and waiting
    // longer than the debounce. Silly promises, not being cancellable... ᕕ( ᐛ )ᕗ
    await wait(500);
    await this.iframeRenderPreview();
  });

  constructor(props: IProps) {
    super(props);

    this.debouncedRenderPreviewFunction = debounce(200, this.runChallengeTests);

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

    const dimensions = getDimensions();
    const { testResults, isPreviewTestResults } =
      this.getDefaultTestResultsState();

    this.state = {
      dimensions,
      testResults,
      code: initialCode,
      isPreviewTestResults,
      logs: DEFAULT_LOGS,
      hideSuccessModal: true,
      testResultsLoading: false,
      shouldRefreshLayout: false,
      mobileDevicePreviewType: "ios",
      monacoInitializationError: false,
    };
  }

  async componentDidMount() {
    window.addEventListener("resize", this.handleWindowResize);
    document.addEventListener("keydown", this.handleKeyPress);
    window.addEventListener(
      "message",
      this.handleReceiveMessageFromCodeRunner,
      false,
    );

    subscribeCodeWorker(this.handleCodeFormatMessage);

    /**
     * Auto-run the tests for media challenges, because this makes more
     * sense. This could adjust in the future for other challenge types
     * if needed.
     *
     * Other challenge types do not auto-run now as a protection
     * mechanism against infinite loops or recursion which can be very
     * hard for the user to recover from.
     */
    if (
      this.props.challenge.type === "markup" &&
      this.props.challenge.id !== SANDBOX_ID
    ) {
      this.runChallengeTests();
    }
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.handleWindowResize);
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

    // Cancel the test cancellation timer
    this.handleCancelCancellationTimer();
  }

  componentDidUpdate(prevProps: IProps) {
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

    // Reset the code if the user toggles in and out of isEditMode.
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
        this.setState({ code: userCode }, this.runChallengeTests);
      }
    }

    const deepLinkDismissed =
      this.props.deepLinkCodeString === null &&
      prevProps.deepLinkCodeString !== null;

    // Crude heuristic to determine if the deep link url code string existed
    // and was then dismissed, which is necessary to replace the current
    // Workspace editor code and update the editor content.
    if (deepLinkDismissed) {
      if ("code" in this.props.blob) {
        this.setState(
          { code: this.props.blob.code },
          this.pauseAndRefreshEditor,
        );
      }
    }

    // Account for changing the challenge type in the sandbox. Otherwise nothing
    // gets re-rendered since the ID of the challenge does not change
    if (prevProps.challenge.type !== this.props.challenge.type) {
      this.pauseAndRefreshEditor();
    }

    // Refresh grid layout when Codepress alternate edit mode changes
    if (
      prevProps.editModeAlternativeViewEnabled !==
      this.props.editModeAlternativeViewEnabled
    ) {
      this.refreshGridLayout();
    }

    // Instructions panel collapse state toggled
    if (
      prevProps.isInstructionsViewCollapsed !==
      this.props.isInstructionsViewCollapsed
    ) {
      // Side effect doesn't apply on mobile
      if (!this.props.isMobileView) {
        document
          .getElementById(INSTRUCTIONS_VIEW_PANEL_ID)
          ?.scrollTo({ top: 0 });

        this.refreshGridLayout();
      }
    }
  }

  render() {
    const {
      logs,
      testResults,
      dimensions: D,
      hideSuccessModal,
      testResultsLoading,
      shouldRefreshLayout,
      mobileDevicePreviewType,
      isPreviewTestResults,
    } = this.state;
    const {
      challenge,
      isEditMode,
      userSettings,
      isMobileView,
      isSqlChallenge,
      revealSolutionCode,
      useCodemirrorEditor,
      isReactNativeChallenge,
      isInstructionsViewCollapsed,
      editModeAlternativeViewEnabled,
    } = this.props;
    const { fullScreenEditor } = userSettings;
    const { failingTests, correct: allTestsPassing } =
      this.getTestPassedStatus();
    const NO_TESTS_RESULTS = testResults.length === 0 || isPreviewTestResults;
    const IS_ALTERNATIVE_EDIT_VIEW = editModeAlternativeViewEnabled;
    const IS_SANDBOX = challenge.id === SANDBOX_ID;
    const IS_FULLSCREEN = fullScreenEditor || IS_SANDBOX;
    const IS_REACT_CHALLENGE = challenge.type === "react";
    const IS_REACT_NATIVE_CHALLENGE = isReactNativeChallenge;
    const IS_MARKUP_CHALLENGE = challenge.type === "markup";
    const IS_TYPESCRIPT_CHALLENGE = challenge.type === "typescript";
    const IS_ALTERNATE_LANGUAGE_CHALLENGE =
      isAlternateLanguageChallenge(challenge);

    const IS_SQL_CHALLENGE = isSqlChallenge;
    const IS_GREAT_SUCCESS_OPEN =
      allTestsPassing &&
      !isEditMode &&
      !hideSuccessModal &&
      !revealSolutionCode &&
      challenge.id !== SANDBOX_ID;

    // Default to code mirror for mobile and for alternate challenges
    const CodeEditor =
      isMobileView || useCodemirrorEditor
        ? WorkspaceCodemirrorEditor
        : WorkspaceMonacoEditor;

    const theme = userSettings.appTheme;
    const IS_DARK = userSettings.appTheme === "dark";
    const setTheme = (dark: string, light: string) => {
      return IS_DARK ? dark : light;
    };

    // Allow the content in the Console to scroll if it overflows
    const ScrollableWorkspaceConsole = (
      <div
        style={{
          height: "100%",
          overflow: "scroll",
          paddingBottom: 6,
          overscrollBehavior: "none",
        }}
      >
        <Console variant={theme} logs={this.state.logs} />
      </div>
    );

    const WorkspaceTestContainer = (
      <>
        <TabbedInnerNav show={isEditMode}>
          <Tab
            active={this.props.adminTestTab === "testResults"}
            onClick={() => this.handleTestTabClick("testResults")}
          >
            Test Results
          </Tab>
          <Tab
            active={this.props.adminTestTab === "testCode"}
            onClick={() => this.handleTestTabClick("testCode")}
          >
            Test Code
          </Tab>
          {IS_ALTERNATIVE_EDIT_VIEW && (
            <Tab
              active={this.props.adminTestTab === "console"}
              onClick={() => this.handleTestTabClick("console")}
            >
              Console
            </Tab>
          )}
          {isEditMode && (
            <TestStatusTextTab
              passing={allTestsPassing}
              testsRunning={testResultsLoading}
              IconButtonProp={
                <Tooltip2
                  position="right"
                  interactionKind="hover-target"
                  content="Toggle Alternate Edit View"
                >
                  <IconButton
                    icon="panel-stats"
                    id="alternate-edit-mode-toggle"
                    aria-label="toggle alternate edit mode"
                    onClick={this.props.toggleAlternativeEditView}
                  />
                </Tooltip2>
              }
            />
          )}
        </TabbedInnerNav>
        {this.props.isEditMode && this.props.adminTestTab === "testCode" ? (
          <ChallengeTestEditor />
        ) : this.props.adminTestTab === "testResults" ? (
          <ContentContainer>
            <ContentTitle style={{ marginBottom: 12 }}>
              {this.getTestSummaryString()}
            </ContentTitle>
            {testResults.map((x, i) => (
              <TestResultRow
                {...x}
                key={i}
                index={i}
                isMobileView={isMobileView}
                testsRunning={testResultsLoading}
                isPreviewTestResults={isPreviewTestResults}
              />
            ))}
            <Spacer height={50} />
          </ContentContainer>
        ) : (
          <>{ScrollableWorkspaceConsole}</>
        )}
      </>
    );

    // Codepress test editor full height
    const TestFullHeightEditor = (
      <Col
        style={getConsoleRowStyles(theme)}
        initialHeight={D.WORKSPACE_HEIGHT}
      >
        <>{IS_ALTERNATIVE_EDIT_VIEW && WorkspaceTestContainer}</>
        <div>
          {!IS_ALTERNATIVE_EDIT_VIEW && ScrollableWorkspaceConsole}
          <DragIgnorantFrameContainer
            id="iframe"
            title="code-preview"
            ref={this.setIframeRef}
            style={{ visibility: "hidden", height: 0, width: 0 }}
          />
        </div>
      </Col>
    );

    const CODE_EDITOR_CONTAINER = (
      <CodeEditorContainer>
        <GreatSuccess
          challenge={challenge}
          isOpen={IS_GREAT_SUCCESS_OPEN}
          onClose={this.handleCloseSuccessModal}
          onClickOutside={this.handleCloseSuccessModal}
        />
        <TabbedInnerNav show={isEditMode}>
          {IS_ALTERNATIVE_EDIT_VIEW && (
            <Tab
              onClick={() => this.handleEditorTabClick("instructions")}
              active={this.props.adminEditorTab === "instructions"}
            >
              Instructions
            </Tab>
          )}
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
        {this.props.adminEditorTab === "instructions" ? (
          <ContentContainer>
            <InstructionsViewEdit />
          </ContentContainer>
        ) : (
          <>
            <CodeEditorUpperRight isEditMode={isEditMode}>
              {revealSolutionCode && (
                <RevealSolutionLabel
                  hideSolution={this.props.handleToggleSolutionCode}
                />
              )}
              <RunButton
                fill
                icon="play"
                id="pw-run-code"
                large={isMobileView}
                loading={testResultsLoading}
                onClick={this.handleUserTriggeredTestRun}
                aria-label="run the current editor code"
              >
                Run
              </RunButton>
            </CodeEditorUpperRight>
            <LowerRight>
              <ButtonGroup vertical={!isMobileView}>
                <Tooltip2
                  disabled={isMobileView}
                  content="Increase Font Size"
                  position={isMobileView ? "top" : "left"}
                  interactionKind={"hover-target"}
                >
                  <IconButton
                    large={isMobileView}
                    id="editor-increase-font-size"
                    icon="plus"
                    aria-label="increase editor font size"
                    onClick={this.props.increaseFontSize}
                  />
                </Tooltip2>
                <Tooltip2
                  disabled={isMobileView}
                  content="Decrease Font Size"
                  position={isMobileView ? "top" : "left"}
                  interactionKind={"hover-target"}
                >
                  <IconButton
                    large={isMobileView}
                    id="editor-decrease-font-size"
                    icon="minus"
                    aria-label="decrease editor font size"
                    onClick={this.props.decreaseFontSize}
                  />
                </Tooltip2>
              </ButtonGroup>
              <div style={{ marginBottom: 8 }} />
              {/* Code formatting is available only for HTML/CSS/TS challenges */}
              {!isMobileView && !IS_ALTERNATE_LANGUAGE_CHALLENGE && (
                <Tooltip2 content="Format Code" position="left">
                  <IconButton
                    icon="clean"
                    large={isMobileView}
                    id="editor-format-code"
                    aria-label="format editor code"
                    onClick={this.handleRequestCodeFormatting}
                  />
                </Tooltip2>
              )}
              <div style={{ marginBottom: 8 }} />
              <Popover2
                content={
                  <Menu large>
                    {!IS_SANDBOX && !isMobileView && (
                      <MenuItem
                        id="editor-toggle-full-screen"
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
                    {!isMobileView && !useCodemirrorEditor && (
                      <MenuItem
                        id="editor-toggle-high-contrast"
                        icon="contrast"
                        aria-label="toggle high contrast mode"
                        text="Toggle High Contrast Mode"
                        onClick={this.props.toggleHighContrastMode}
                      />
                    )}
                    {!isMobileView && (
                      <MenuItem
                        id="editor-toggle-codemirror-editor"
                        icon="application"
                        aria-label="toggle codemirror editor"
                        text="Toggle Alternate Editor"
                        onClick={this.props.toggleCodemirrorEditor}
                      />
                    )}
                    {isReactNativeChallenge && (
                      <MenuItem
                        icon="mobile-phone"
                        id="editor-toggle-mobile-device-preview"
                        aria-label="toggle mobile device preview setting"
                        onClick={this.toggleMobileDevicePreview}
                        text={
                          mobileDevicePreviewType === "ios"
                            ? "Use Android Mobile Device"
                            : "Use iOS Mobile Device"
                        }
                      />
                    )}
                    {isMobileView && (
                      <MenuItem
                        id="editor-format-code-mobile"
                        icon="clean"
                        aria-label="format editor code"
                        onClick={this.handleRequestCodeFormatting}
                        text="Auto-format Code"
                      />
                    )}
                    {!isMobileView && (
                      <MenuItem
                        id="editor-export-code"
                        icon="download"
                        onClick={this.handleExport}
                        text="Export Code to File"
                        aria-label="export code to file"
                      />
                    )}
                    <MenuItem
                      id="editor-share-code"
                      icon="clipboard"
                      onClick={this.handleCreateShareCodeLink}
                      text="Copy Shareable Code Link"
                      aria-label="copy shareable code link"
                    />
                    <MenuDivider />
                    <MenuItem
                      id="editor-restore-initial-code"
                      icon="reset"
                      aria-label="reset editor"
                      onClick={this.resetCodeWindow}
                      text="Restore Initial Code"
                    />
                    {!IS_SANDBOX && (
                      <MenuItem
                        id="editor-toggle-solution-code"
                        icon={
                          revealSolutionCode ? "application" : "applications"
                        }
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
                position={
                  isMobileView ? Position.TOP_LEFT : Position.LEFT_BOTTOM
                }
              >
                <Tooltip2
                  content="More options..."
                  position={isMobileView ? "top" : "left"}
                >
                  <IconButton
                    large={isMobileView}
                    id="editor-more-options"
                    aria-label="more options"
                    icon="more"
                  />
                </Tooltip2>
              </Popover2>
            </LowerRight>
            <CodeEditor
              isEditMode={isEditMode}
              value={this.state.code}
              userSettings={this.props.userSettings}
              editorOptions={this.props.editorOptions}
              onChange={this.handleEditorContentChange}
              challengeType={this.props.challenge.type}
              language={this.getMonacoLanguageFromChallengeType()}
              onDidBlurEditorText={this.handleAutoFormatCodeOnBlur}
              isReactNativeChallenge={isReactNativeChallenge}
              isBackendModuleChallenge={this.props.isBackendModuleChallenge}
              isTestingAndAutomationChallenge={
                this.props.isTestingAndAutomationChallenge
              }
            />
          </>
        )}
      </CodeEditorContainer>
    );

    const iFrameNormal = (
      <DragIgnorantFrameContainer
        id="iframe"
        title="code-preview"
        ref={this.setIframeRef}
      />
    );

    const iFrameHidden = (
      <DragIgnorantFrameContainer
        id="iframe"
        title="code-preview"
        ref={this.setIframeRef}
        style={{ visibility: "hidden", height: 0, width: 0 }}
      />
    );

    const getPreviewPane = (isMobile: boolean = false) => {
      if (isMobile) {
        return IS_SQL_CHALLENGE ? (
          // this className ensures consistent bg-color with the table itself
          <div style={{ height: "100%" }} className="bp3-table-container">
            {SQLResultsTable({ logs, testResultsLoading })}
            {iFrameNormal}
          </div>
        ) : IS_REACT_NATIVE_CHALLENGE ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <MobileDeviceUI device={mobileDevicePreviewType}>
              {iFrameNormal}
            </MobileDeviceUI>
            <div style={{ flex: "1 100%", paddingTop: 12, minHeight: 250 }}>
              <Console variant={theme} logs={this.state.logs} />
            </div>
          </div>
        ) : IS_REACT_CHALLENGE ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ flex: "1 100%" }}>{iFrameNormal}</div>
            <div style={{ flex: "1 100%", paddingTop: 12, minHeight: 250 }}>
              <Console variant={theme} logs={this.state.logs} />
            </div>
          </div>
        ) : IS_TYPESCRIPT_CHALLENGE ? (
          <div>
            <Console variant={theme} logs={this.state.logs} />
            {iFrameHidden}
          </div>
        ) : IS_ALTERNATE_LANGUAGE_CHALLENGE ? (
          <div>
            <Console variant={theme} logs={this.state.logs} />
            {iFrameHidden}
          </div>
        ) : IS_MARKUP_CHALLENGE ? (
          <div style={{ height: "100%" }}>{iFrameNormal}</div>
        ) : (
          /* Handle other challenge types ~ */
          <div id="the-div-that-should-not-render" />
        );
      }

      return IS_SQL_CHALLENGE ? (
        // this className ensures consistent bg-color with the table itself
        <Col className="bp3-table-container" initialHeight={D.WORKSPACE_HEIGHT}>
          <EmptyPreviewCoverPanel
            visible={NO_TESTS_RESULTS}
            runCodeHandler={this.runChallengeTests}
          />
          {SQLResultsTable({ logs, testResultsLoading })}
          <div>{iFrameHidden}</div>
        </Col>
      ) : IS_REACT_NATIVE_CHALLENGE ? (
        <Col initialHeight={D.WORKSPACE_HEIGHT}>
          <EmptyPreviewCoverPanel
            visible={NO_TESTS_RESULTS}
            runCodeHandler={this.runChallengeTests}
          />
          <RowsWrapper separatorProps={getRowSeparatorProps(theme)}>
            <Row initialHeight={D.PREVIEW_REACT_NATIVE_HEIGHT}>
              <MobileDeviceUI device={mobileDevicePreviewType}>
                {iFrameNormal}
              </MobileDeviceUI>
            </Row>
            <Row
              style={getConsoleRowStyles(theme)}
              initialHeight={D.PREVIEW_CONSOLE_REACT_NATIVE_HEIGHT}
            >
              {ScrollableWorkspaceConsole}
            </Row>
          </RowsWrapper>
        </Col>
      ) : IS_REACT_CHALLENGE ? (
        <Col initialHeight={D.WORKSPACE_HEIGHT}>
          <EmptyPreviewCoverPanel
            visible={NO_TESTS_RESULTS}
            runCodeHandler={this.runChallengeTests}
          />
          <RowsWrapper separatorProps={getRowSeparatorProps(theme)}>
            <Row initialHeight={D.PREVIEW_HEIGHT}>
              <div style={{ height: "100%" }}>{iFrameNormal}</div>
            </Row>
            <Row
              style={getConsoleRowStyles(theme)}
              initialHeight={D.CONSOLE_HEIGHT}
            >
              {ScrollableWorkspaceConsole}
            </Row>
          </RowsWrapper>
        </Col>
      ) : IS_TYPESCRIPT_CHALLENGE ? (
        <Col
          style={getConsoleRowStyles(theme)}
          initialHeight={D.WORKSPACE_HEIGHT}
        >
          <EmptyPreviewCoverPanel
            visible={NO_TESTS_RESULTS}
            runCodeHandler={this.runChallengeTests}
          />
          {ScrollableWorkspaceConsole}
          <div>{iFrameHidden}</div>
        </Col>
      ) : IS_ALTERNATE_LANGUAGE_CHALLENGE ? (
        <Col
          style={getConsoleRowStyles(theme)}
          initialHeight={D.WORKSPACE_HEIGHT}
        >
          <EmptyPreviewCoverPanel
            visible={NO_TESTS_RESULTS}
            runCodeHandler={this.runChallengeTests}
          />
          {ScrollableWorkspaceConsole}
          <div>{iFrameHidden}</div>
        </Col>
      ) : IS_MARKUP_CHALLENGE ? (
        <Col initialHeight={D.WORKSPACE_HEIGHT}>
          <EmptyPreviewCoverPanel
            visible={NO_TESTS_RESULTS}
            runCodeHandler={this.runChallengeTests}
          />
          <div style={{ height: "100%" }}>{iFrameNormal}</div>
        </Col>
      ) : (
        /* Handle other challenge types ~ */
        <div id="the-div-that-should-not-render" />
      );
    };

    const mobileView = isMobileView && (
      <WorkspaceMobileView>
        {!IS_SANDBOX && (
          <div style={{ height: "auto", flexShrink: 0, maxHeight: "25vh" }}>
            <InstructionsViewEdit isMobile={isMobileView} />
          </div>
        )}
        <div className="tabs">
          <div className="tab-selection">
            <ButtonGroup fill large>
              <Button
                onClick={() => {
                  document
                    .getElementById(MOBILE_SCROLL_PANEL_ID)
                    ?.scrollTo({ left: 0, behavior: "smooth" });
                }}
                icon="code"
              >
                Code
              </Button>
              <Button
                onClick={() => {
                  document.getElementById(MOBILE_SCROLL_PANEL_ID)?.scrollTo({
                    left: this.state.dimensions.w,
                    behavior: "smooth",
                  });
                }}
                icon="console"
              >
                Result
              </Button>
              {!IS_SANDBOX && (
                <Button
                  className="test-view-button"
                  data-failing={failingTests.length}
                  onClick={() => {
                    document.getElementById(MOBILE_SCROLL_PANEL_ID)?.scrollTo({
                      left: this.state.dimensions.w * 2,
                      behavior: "smooth",
                    });
                  }}
                >
                  <small
                    className={
                      "mobile-tests-badge " +
                      (failingTests.length ? "fail" : "success")
                    }
                  >
                    {failingTests.length > 9
                      ? "9+"
                      : failingTests.length || "✓"}
                  </small>
                  Tests
                </Button>
              )}
            </ButtonGroup>
          </div>
          <div id={MOBILE_SCROLL_PANEL_ID} className="panel">
            <div className="panel-scroll">
              <ContentContainer style={{ padding: 0 }}>
                {CODE_EDITOR_CONTAINER}
              </ContentContainer>
              <ContentContainer>{getPreviewPane(true)}</ContentContainer>
              {!IS_SANDBOX && (
                <ContentContainer className="test-container">
                  {WorkspaceTestContainer}
                </ContentContainer>
              )}
            </div>
          </div>
        </div>
      </WorkspaceMobileView>
    );

    return (
      <Container>
        <PageSection>
          <WorkspaceContainer>
            {isMobileView ? (
              mobileView
            ) : shouldRefreshLayout ? null : (
              <ColsWrapper separatorProps={getColSeparatorProps(theme)}>
                <Col
                  initialWidth={
                    IS_ALTERNATIVE_EDIT_VIEW
                      ? D.HALF_WIDTH
                      : D.EDITOR_PANEL_WIDTH
                  }
                  initialHeight={D.WORKSPACE_HEIGHT}
                >
                  {IS_FULLSCREEN || IS_ALTERNATIVE_EDIT_VIEW ? (
                    <div
                      style={{
                        height: "100%",
                        background: setTheme(
                          C.BACKGROUND_CONSOLE_DARK,
                          C.BACKGROUND_CONSOLE_LIGHT,
                        ),
                      }}
                    >
                      {CODE_EDITOR_CONTAINER}
                    </div>
                  ) : (
                    <RowsWrapper separatorProps={getRowSeparatorProps(theme)}>
                      <Row
                        initialHeight={
                          isInstructionsViewCollapsed
                            ? D.CHALLENGE_CONTENT_HEIGHT_COLLAPSED
                            : D.CHALLENGE_CONTENT_HEIGHT
                        }
                        style={{
                          background: setTheme(
                            C.BACKGROUND_CONTENT_DARK,
                            C.BACKGROUND_CONTENT_LIGHT,
                          ),
                        }}
                      >
                        <ContentContainer>
                          <InstructionsViewEdit />
                        </ContentContainer>
                      </Row>
                      <Row
                        style={{ background: C.BACKGROUND_EDITOR }}
                        initialHeight={
                          isInstructionsViewCollapsed
                            ? D.EDITOR_HEIGHT_INSTRUCTIONS_COLLAPSED
                            : D.EDITOR_HEIGHT
                        }
                      >
                        {CODE_EDITOR_CONTAINER}
                      </Row>
                      <Row
                        initialHeight={D.TEST_CONTENT_HEIGHT}
                        style={{
                          background: setTheme(
                            C.BACKGROUND_CONTENT_DARK,
                            C.BACKGROUND_CONTENT_LIGHT,
                          ),
                        }}
                      >
                        {WorkspaceTestContainer}
                      </Row>
                    </RowsWrapper>
                  )}
                </Col>
                {IS_ALTERNATIVE_EDIT_VIEW
                  ? TestFullHeightEditor
                  : getPreviewPane()}
              </ColsWrapper>
            )}
          </WorkspaceContainer>
        </PageSection>
      </Container>
    );
  }

  /**
   * For non-markup challenges (React, TS), enable the user to
   * preview test messages without the tests being run
   */
  getDefaultTestResultsState = () => {
    if (this.props.challenge.type !== "markup") {
      const { error, results } = buildPreviewTestResultsFromCode(
        this.props.challenge.testCode,
      );

      if (results?.length) {
        return {
          testResults: results,
          isPreviewTestResults: true,
        };
      } else {
        console.warn(
          `[getPreviewTestResults] buildPreviewTestResultsFromCode failed: ${error}`,
        );
      }
    }

    return {
      testResults: [],
      isPreviewTestResults: false,
    };
  };

  /**
   * Reset the code editor content to the starterCode.
   */
  resetCodeWindow = () => {
    this.transformMonacoCode(() => this.props.challenge.starterCode);
    // Hide the solution code if it was visible
    if (this.props.revealSolutionCode) {
      this.props.handleToggleSolutionCode();
    }
  };

  getMonacoLanguageFromChallengeType = () => {
    const { type } = this.props.challenge;

    switch (type) {
      case "golang":
        return "go";
      case "python":
        return "python";
      case "rust":
        return "rust";
      case "react":
      case "typescript":
        return "typescript";
      case "markup":
        return "html";
      default:
        console.warn(`[WARNING] Invalid challenge type for monaco: ${type}`);
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
    if (tab === "instructions") {
      this.props.setAdminEditorTab(tab);
    } else {
      this.setState(
        {
          code: this.props.challenge[tab] || this.props.challenge.starterCode,
        },
        () => {
          this.props.setAdminEditorTab(tab);
        },
      );
    }
  };

  /**
   * Switch tabs in the test area of the workspace. So that we can see test
   * results and write tests using different tabs.
   */
  handleTestTabClick = async (tab: ADMIN_TEST_TAB) => {
    if (tab !== this.props.adminTestTab) {
      this.props.setAdminTestTab(tab);
    }
  };

  handleCloseSuccessModal = () => {
    this.setState({ hideSuccessModal: true });
  };

  toggleMobileDevicePreview = () => {
    this.setState(
      ({ mobileDevicePreviewType: x }) => ({
        mobileDevicePreviewType: x === "ios" ? "android" : "ios",
      }),
      this.iframeRenderPreview,
    );
  };

  getTestPassedStatus = () => {
    const { testResults, testResultsLoading } = this.state;
    const [passedTests, failingTests] = partition<TestCase>(
      (t) => t.testResult,
    )(testResults);

    const correct =
      !testResultsLoading &&
      passedTests.length > 0 &&
      passedTests.length === testResults.length;

    return { correct, passedTests, failingTests, testResults };
  };

  getTestSummaryString = () => {
    // Tests are still loading
    if (this.state.testResultsLoading) {
      return "Processing Test Results...";
    }

    const { passedTests, testResults } = this.getTestPassedStatus();

    // No results exist yet
    if (testResults.length === 0 || this.state.isPreviewTestResults) {
      return "No test results yet.";
    }

    // Return status message
    return `Tests: ${passedTests.length}/${testResults.length} Passed`;
  };

  handleEditorContentChange = (code: string) => {
    /**
     * Update the stored code value and then:
     *
     * - Save the code to local storage (debounced)
     * - Render the iframe preview (debounced)
     */
    this.setState({ code }, () => {
      this.debouncedSaveCodeFunction();

      /**
       * Only live preview markup challenges, for the UI.
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
      this.scrollableWorkspaceConsole({ data, method });
    };

    try {
      const { source, message } = event.data;
      switch (source) {
        case IFRAME_MESSAGE_TYPES.LOG: {
          return handleLogMessage(message, "log");
        }
        case IFRAME_MESSAGE_TYPES.INFO: {
          return handleLogMessage(message, "info");
        }
        case IFRAME_MESSAGE_TYPES.WARN: {
          return handleLogMessage(message, "warn");
        }
        case IFRAME_MESSAGE_TYPES.ERROR: {
          return handleLogMessage(message, "error");
        }
        case IFRAME_MESSAGE_TYPES.INFINITE_LOOP: {
          toaster.toast.clear(); /* Clear existing toasts */
          toaster.warn("Please check your code for infinite loops!");
          break;
        }
        case IFRAME_MESSAGE_TYPES.TEST_RESULTS: {
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
          console.warn(
            "[ERR] Something went wrong with the tests:",
            source,
            message,
          );
          this.setState({ testResultsLoading: false, hideSuccessModal: true });
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
    this.handleCancelCancellationTimer();
    const { correct } = this.getTestPassedStatus();

    // If the solution failed, disabled showing the success modal.
    if (!correct) {
      this.setState({ hideSuccessModal: true });
    }

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
    }
  };

  iframeRenderPreview = async (): Promise<void> => {
    if (!this.iFrameRef || !this.iFrameRef.contentWindow) {
      console.warn("[iframe] Not yet mounted.");
      return;
    }

    const { type } = this.props.challenge;

    // Process the code string and create an HTML document to render
    // to the iframe.
    try {
      // Should give some searchable text should we encounter this.
      let sourceDocument = "<!-- SHOULD_BE_OVERWRITTEN -->";

      if (type === "markup") {
        sourceDocument = getMarkupSrcDocument(
          this.state.code,
          this.props.challenge.testCode,
          WORKSPACE_LIB,
        );
      } else {
        let libs = WORKSPACE_LIB;

        // Add express library for backend module challenges
        if (this.props.isBackendModuleChallenge) {
          libs += EXPRESS_JS_LIB;
        }

        const code = await this.compileAndTransformCodeString();
        sourceDocument = getMarkupForCodeChallenge(code, libs);
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

    // Slide the preview window into view. Only applicable on mobile
    if (this.props.isMobileView) {
      document
        .getElementById(MOBILE_SCROLL_PANEL_ID)
        ?.scrollTo({ left: this.state.dimensions.w * 2, behavior: "smooth" });
    }
  };

  // NOTE We manage the false loading state where test results are received. The
  // iframeRenderPreview method only puts the tests into the DOM where they will
  // automatically run, but if we were to use that promise to set
  // testResultsLoading to false we would run into cases where the tests hadn't
  // finished running yet.
  runChallengeTests = async () => {
    if (!this.iFrameRef) {
      return;
    }

    this.setState(
      {
        logs: DEFAULT_LOGS,
        testResultsLoading: true, // See NOTE
        isPreviewTestResults: false,
      },
      () => {
        // Start the test cancellation timer and render the code preview
        this.startTestCancellationTimer();
        this.iframeRenderPreview();
      },
    );
  };

  handleCancelCancellationTimer = () => {
    // Clear any existing timer
    if (this.testCancellationTimer) {
      clearTimeout(this.testCancellationTimer);
    }
  };

  startTestCancellationTimer = () => {
    this.handleCancelCancellationTimer();

    const timeout = this.getTestTimeout();

    // Allow 10 seconds for the tests to run
    this.testCancellationTimer = setTimeout(this.handleCancelTests, timeout);
  };

  getTestTimeout = () => {
    // Allow alternate language challenges more execution time
    return isAlternateLanguageChallenge(this.props.challenge) ? 25000 : 10000;
  };

  handleCancelTests = () => {
    if (this.state.testResults) {
      this.cancelTestRun();
    }
  };

  cancelTestRun = () => {
    this.setState({ testResultsLoading: false }, () => {
      const timeout = this.getTestTimeout();
      const seconds = timeout / 1000;
      toaster.warn(
        `${
          this.props.challenge.id === SANDBOX_ID ? "Code execution" : "Tests"
        } cancelled because your code took longer than ${seconds} seconds to complete running. Check your code for problems and make sure your internet connection is stable!`,
      );
    });
  };

  compileAndTransformCodeString = async () => {
    try {
      const { code } = await compileCodeString(
        this.state.code,
        this.props.challenge,
      );

      return code;
    } catch (err) {
      /**
       * NOTE: It is possible some syntax errors will cause the Babel transform
       * method to throw an error. This was happening to users previously and
       * resulting in uncaught errors which were reported to Sentry. If
       * something like that happens, or if any other error occurs from the
       * compileCodeString function, we catch that here and display a generic
       * "Code Must Compile" error.
       */
      this.handleCompilationError(
        new Error("The code should compile with no errors."),
      );

      return "";
    }
  };

  handleCompilationError = (error: Error) => {
    const testResults = [
      {
        test: "",
        testResult: false,
        error: error.message,
        message: error.message,
      },
    ];
    const log = Decode([
      {
        method: "error",
        data: [error.message],
      },
    ]);
    this.scrollableWorkspaceConsole(log);
    this.setState({ testResults, testResultsLoading: false });
  };

  scrollableWorkspaceConsole = (log: Log) => {
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
    traverse(data).forEach(function (x) {
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

  setIframeRef = (ref: HTMLIFrameElement) => {
    this.iFrameRef = ref;
  };

  /**
   * The resizable cols are not declarative in their sizing. They take initial
   * dimensions but if we want to update their dimensions we need to completely
   * re-render. That's what this "state flash" let's us do.
   */
  private readonly refreshGridLayout = () => {
    const reset = () => {
      this.setState({ shouldRefreshLayout: false }, this.iframeRenderPreview);
    };

    this.setState({ shouldRefreshLayout: true }, reset);
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
    const meta = getFileExtensionByChallengeType(this.props.challenge);

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
      // just worried some browsers might not allow a click on an element that
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

  private readonly handleCreateShareCodeLink = () => {
    const url = window.location.href;
    const code = encodeURIComponent(this.state.code);

    // Add sandbox challenge type if applicable
    const { challenge } = this.props;
    const sandboxParam =
      challenge.id === SANDBOX_ID
        ? `&sandboxChallengeType=${challenge.type}`
        : "";

    const link = `${url}?code=${code}${sandboxParam}`;
    copyToClipboard(link);
    toaster.success("Shareable code link copied to clipboard!");
  };

  private readonly handleAutoFormatCodeOnBlur = () => {
    if (this.props.isEditMode) {
      this.handleRequestCodeFormatting();
    }
  };

  private readonly handleRequestCodeFormatting = () => {
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
    this.setState({ code: fn(this.state.code) });
  };

  private readonly pauseAndRefreshEditor = async (timeout = 50) => {
    // Be sure to cancel any in-flight timeout before setting up a new one
    if (this.editorRefreshTimerHandler) {
      clearTimeout(this.editorRefreshTimerHandler);
    }

    this.editorRefreshTimerHandler = setTimeout(
      this.runChallengeTests,
      timeout,
    );
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
  isDirty: ChallengeSelectors.isDirty(state),
  isUserLoading: Modules.selectors.user.loading(state),
  challenge: ChallengeSelectors.getCurrentChallenge(state),
  userSettings: Modules.selectors.user.userSettings(state),
  editorOptions: Modules.selectors.user.editorOptions(state),
  blob: ChallengeSelectors.getBlobForCurrentChallenge(state),
  showMediaArea: ChallengeSelectors.getHasMediaContent(state),
  adminTestTab: ChallengeSelectors.adminTestTabSelector(state),
  revealSolutionCode: ChallengeSelectors.revealSolutionCode(state),
  deepLinkCodeString: ChallengeSelectors.deepLinkCodeString(state),
  adminEditorTab: ChallengeSelectors.adminEditorTabSelector(state),
  useCodemirrorEditor: ChallengeSelectors.useCodemirrorEditor(state),
  isLoadingBlob: ChallengeSelectors.isLoadingCurrentChallengeBlob(state),
  isReactNativeChallenge: ChallengeSelectors.isReactNativeChallenge(state),
  isSqlChallenge: ChallengeSelectors.isSqlChallenge(state),
  isInstructionsViewCollapsed:
    Modules.selectors.challenges.isInstructionsViewCollapsed(state),
  isBackendModuleChallenge: ChallengeSelectors.isBackendModuleChallenge(state),
  isTestingAndAutomationChallenge:
    ChallengeSelectors.isTestingAndAutomationChallenge(state),
  editModeAlternativeViewEnabled:
    ChallengeSelectors.editModeAlternativeViewEnabled(state),
});

const dispatchProps = {
  setAdminTestTab: ChallengeActions.setAdminTestTab,
  setAdminEditorTab: ChallengeActions.setAdminEditorTab,
  updateChallenge: ChallengeActions.updateChallenge,
  updateUserSettings: Modules.actions.user.updateUserSettings,
  toggleCodemirrorEditor: ChallengeActions.toggleCodemirrorEditor,
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
      state.userSettings.editorTheme === MonacoEditorThemes.DEFAULT
        ? MonacoEditorThemes.HIGH_CONTRAST
        : MonacoEditorThemes.DEFAULT;
    methods.updateUserSettings({ editorTheme: nextTheme });
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
  isMobileView: boolean;
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
  componentDidMount() {
    window.addEventListener("beforeunload", this.warnUnsavedEdits);
  }

  componentWillUnmount() {
    window.removeEventListener("beforeunload", this.warnUnsavedEdits);
  }

  render() {
    const { challenge, blob, isLoadingBlob, isUserLoading } = this.props;

    if (isLoadingBlob || isUserLoading) {
      return (
        <div style={{ marginTop: 150 }}>
          <Loading />
        </div>
      );
    } else if (!challenge) {
      // A challenge did not load... this should be handled by a 404 page
      // elsewhere, but adding this here for type-checking.
      return null;
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

    // The reason for two checks here is that even on larger screens we still
    // want to use the mobile editor if this is detected as a tablet. Safari
    // seems to handle monaco just fine but Android breaks, so android tablets
    // should get codemirror
    const isMobileView = isMobile() || getDimensions().w < 700;

    return (
      <React.Fragment>
        <SEO {...seoMeta} />
        {requiresWorkspace && (
          <Workspace
            {...this.props}
            blob={codeBlob}
            challenge={challenge}
            isMobileView={isMobileView}
          />
        )}
        {!isSandbox && (CODEPRESS || this.props.showMediaArea) && (
          <LowerSection withHeader={challenge.type === "media"}>
            <MediaArea challenge={challenge} />
          </LowerSection>
        )}
      </React.Fragment>
    );
  }

  // I took this mostly from the docs:
  // http://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onbeforeunload#Example
  private readonly warnUnsavedEdits = (e: BeforeUnloadEvent) => {
    if (this.props.isDirty) {
      e.preventDefault();
      e.returnValue = "";
    } else {
      delete e.returnValue;
    }
  };
}

// Strip characters that would probably not look great in SEO results
const stripChars = (s: string) => {
  return s
    .replace(/\n/g, ". ") // Join newlines with a period and a space
    .replace(/[^A-Za-z0-9 ,."'!?]/g, ""); // Whitelist alpha numeric characters plus a few standard others
};

const getSeoExcerpt = pipe(
  (x: Challenge) => x.instructions || x.content, // Prioritize instructions over content. The most common case is one or the other not both
  stripChars,
  (x: string) => truncate(x, 150),
);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default composeWithProps<{}>(withProps)(WorkspaceLoadingContainer);
