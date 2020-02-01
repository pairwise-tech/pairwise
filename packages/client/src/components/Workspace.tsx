// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import SyntaxHighlightWorker from "workerize-loader!../tools/tsx-syntax-highlighter";

import { monaco } from "@monaco-editor/react";
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
  DIMENSIONS as D,
  SANDBOX_ID,
  MONACO_EDITOR_FONT_SIZE_STEP,
  AppToaster,
} from "../tools/constants";
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
import { LowerRight, IconButton } from "./Shared";
import { Tooltip, ButtonGroup } from "@blueprintjs/core";
import { MonacoEditorOptions } from "modules/challenges/types";
import {
  wait,
  composeWithProps,
  constructDataBlobFromChallenge,
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
  ContentViewEdit,
  ContentTitle,
  TestResultRow,
  Spacer,
  DragIgnorantFrameContainer,
  consoleRowStyles,
  LowerSection,
} from "./WorkspaceComponents";
import { ADMIN_TEST_TAB, ADMIN_EDITOR_TAB } from "modules/challenges/store";
import { EXPECTATION_LIB } from "tools/browser-test-lib";
import cx from "classnames";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

const CODE_FORMAT_CHANNEL = "WORKSPACE_MAIN";

type ConsoleLogMethods = "warn" | "info" | "error" | "log";

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

interface IState {
  code: string;
  fullScreenEditor: boolean;
  testResults: ReadonlyArray<TestCase>; // TODO: This should no longer be necessary after testString is up and running
  monacoInitializationError: boolean;
  logs: ReadonlyArray<{ data: ReadonlyArray<any>; method: string }>;
}

/** ===========================================================================
 * React Component
 * ============================================================================
 */

class Workspace extends React.Component<IProps, IState> {
  syntaxWorker: any = null;

  // The wrapper class provided @monaco-editor/react. Confusingly,
  // monacoWrapper.editor is not the editor instance but a collection of static
  // methods and maybe a class as well. But they are different. Editor instance
  // is needed for updating editor options, i.e. font size.
  monacoWrapper: any = null;

  // The actual monaco editor instance.
  editorInstance: Nullable<{
    updateOptions: (x: MonacoEditorOptions) => void;
  }> = null;

  iFrameRef: Nullable<HTMLIFrameElement> = null;
  debouncedSaveCodeFunction: () => void;
  debouncedRenderPreviewFunction: () => void;
  debouncedSyntaxHighlightFunction: (code: string) => void;

  constructor(props: IProps) {
    super(props);

    this.debouncedRenderPreviewFunction = debounce(
      200,
      this.iFrameRenderPreview,
    );

    this.debouncedSyntaxHighlightFunction = debounce(
      250,
      this.requestSyntaxHighlighting,
    );

    this.debouncedSaveCodeFunction = debounce(50, this.handleChangeEditorCode);

    const initialCode = props.blob.type === "challenge" ? props.blob.code : "";

    this.state = {
      code: initialCode,
      testResults: [],
      logs: DEFAULT_LOGS,
      fullScreenEditor: false,
      monacoInitializationError: false,
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
    this.initializeMonaco();
    this.initializeSyntaxHighlightWorker();

    /* Handle some timing issue with Monaco initialization... */
    await wait(500);
    this.iFrameRenderPreview();
    this.debouncedSyntaxHighlightFunction(this.state.code);

    subscribeCodeWorker(this.handleCodeFormatMessage);
  }

  componentWillUnmount() {
    this.cleanupEditor();
    window.removeEventListener("keydown", this.handleKeyPress);
    window.removeEventListener(
      "message",
      this.handleReceiveMessageFromCodeRunner,
    );
    unsubscribeCodeWorker(this.handleCodeFormatMessage);
  }

  refreshEditor = () => {
    this.resetMonacoEditor();
    this.setMonacoEditorValue();
    if (this.iFrameRef) {
      this.iFrameRenderPreview();
    }
  };

  componentWillReceiveProps(nextProps: IProps) {
    // TODO: Can this be removed? I refactored some code and this may no
    // longer be needed, or I am wrong and more refactoring is required.
    // Update in response to changing challenge
    // if (this.props.challenge.id !== nextProps.challenge.id) {
    //   const { challenge, isEditMode } = nextProps;
    //   const newCode = getEditorCode({
    //     challenge,
    //     isEditMode,
    //     tab: this.state.adminEditorTab,
    //   });
    //   this.setState(
    //     { code: newCode, adminTestTab: "testResults" },
    //     this.refreshEditor,
    //   );
    //

    if (this.props.editorOptions !== nextProps.editorOptions) {
      this.editorInstance?.updateOptions(nextProps.editorOptions);
    }

    if (this.props.userSettings.theme !== nextProps.userSettings.theme) {
      this.setMonacoEditorTheme(nextProps.userSettings.theme);
    }

    // Account for changing the challenge type in the sandbox. Otherwise nothing
    // gets re-rendered since the ID of the challenge does not change
    // TODO: This is ugly because it's unclear why re-rendering immediately fails
    if (this.props.challenge.type !== nextProps.challenge.type) {
      wait(50).then(this.refreshEditor);
    }

    // TODO: Can this be removed? I refactored some code and this may no
    // longer be needed, or I am wrong and more refactoring is required.
    // Update in response to toggling admin edit mode. This will only ever
    // happen for us as we use codepress, not for our end users.
    // if (this.props.isEditMode !== nextProps.isEditMode) {
    //   this.setState(
    //     {
    //       code: getEditorCode({
    //         challenge: nextProps.challenge,
    //         isEditMode: nextProps.isEditMode,
    //         tab: this.state.adminEditorTab,
    //       }),
    //     },
    //     this.refreshEditor,
    //   );
    // }
  }

  /**
   * Reset the code editor content to the starterCode.
   */
  resetCodeWindow = () => {
    this.transformMonacoCode(() => this.props.challenge.starterCode);
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

    const models = this.monacoWrapper.editor.getModels();
    const model = models[0];

    model.decorations = model.deltaDecorations(
      model.decorations || [],
      decorations,
    );
  };

  initializeMonaco = () => {
    monaco
      .init()
      .then(mn => {
        mn.languages.typescript.typescriptDefaults.setCompilerOptions({
          noEmit: true,
          jsx: "react",
          typeRoots: ["node_modules/@types"],
          allowNonTsExtensions: true,
          target: mn.languages.typescript.ScriptTarget.ES2016,
          module: mn.languages.typescript.ModuleKind.CommonJS,
          moduleResolution: mn.languages.typescript.ModuleResolutionKind.NodeJs,
        });

        mn.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
          noSyntaxValidation: false,
          noSemanticValidation: false,
        });

        this.monacoWrapper = mn;

        this.initializeMonacoEditor();
      })
      .catch(error => {
        console.error(
          "An error occurred during initialization of Monaco: ",
          error,
        );
        this.setState({ monacoInitializationError: true });
      });
  };

  initializeMonacoEditor = () => {
    const mn = this.monacoWrapper;

    const options = {
      theme: MonacoEditorThemes.DEFAULT,
      automaticLayout: true,
      fixedOverflowWidgets: true,
      minimap: {
        enabled: false,
      },
      ...this.props.editorOptions,
    };

    const language = this.getMonacoLanguageFromChallengeType();

    let model;

    /* Markup challenges: */
    if (this.props.challenge.type === "markup") {
      model = mn.editor.createModel(this.state.code, language);
    } else {
      /* TypeScript and React challenges: */
      model = mn.editor.createModel(
        this.state.code,
        language,
        new mn.Uri.parse("file:///main.tsx"),
      );
    }

    model.onDidChangeContent(this.handleEditorContentChange);

    this.editorInstance = mn.editor.create(
      document.getElementById("monaco-editor"),
      {
        ...options,
        model,
      },
    );

    /**
     * This is a separate model which provides JSX type information. See
     * this for more details: https://github.com/cancerberoSgx/jsx-alone/blob/master/jsx-explorer/HOWTO_JSX_MONACO.md.
     */
    mn.editor.createModel(
      types,
      "typescript",
      mn.Uri.parse("file:///index.d.ts"),
    );

    this.setMonacoEditorTheme(this.props.userSettings.theme);
  };

  getMonacoLanguageFromChallengeType = () => {
    const { type } = this.props.challenge;

    if (type === "react" || type === "typescript") {
      return "typescript";
    } else if (type === "markup") {
      return "html";
    }
  };

  /**
   * Switching tabs in the main code area, so that we can edit the starter code and solution code of a challenge.
   * Doing a check to see if we even need to update state. Normally we would
   * just do a fire-and-forget state update regardless, but with all the
   * imperative logic going on with the editor this keeps it from updating
   * unnecessarily.
   *
   * NOTE: When switching to the solution code default to start code
   */
  handleEditorTabClick = (tab: ADMIN_EDITOR_TAB) => {
    if (tab !== this.props.adminEditorTab) {
      this.setState(
        {
          code: this.props.challenge[tab] || this.props.challenge.starterCode, // See NOTE
        },
        () => {
          this.refreshEditor();
          this.props.setAdminEditorTab(tab);
        },
      );
    }
  };

  /**
   * Switch tabs in the test area of the workspace. So that we can see test results and write tests using different tabs.
   */
  handleTestTabClick = (tab: ADMIN_TEST_TAB) => {
    if (tab !== this.props.adminTestTab) {
      /**
       * NOTE: The reason for this additional logic is to "refresh" the test
       * results when one of us clicks back to the test results tab. That tab is
       * the only tab from the perspective of end users so this should only ever
       * happen when we are editing via codepress.
       */

      if (tab === "testResults") {
        this.refreshEditor();
      }

      this.props.setAdminTestTab(tab);
    }
  };

  render() {
    const { fullScreenEditor, testResults } = this.state;
    const { challenge, isEditMode } = this.props;
    const isSandbox = challenge.id === SANDBOX_ID;
    const isFullScreen = fullScreenEditor || isSandbox;
    const IS_REACT_CHALLENGE = challenge.type === "react";
    const IS_MARKUP_CHALLENGE = challenge.type === "markup";
    const IS_TYPESCRIPT_CHALLENGE = challenge.type === "typescript";

    const MONACO_CONTAINER = (
      <div style={{ height: "100%", position: "relative" }}>
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
        <LowerRight>
          <ButtonGroup vertical style={{ marginBottom: 8 }}>
            <Tooltip content={"Increase Font Size"} position="left">
              <IconButton
                icon="plus"
                aria-label="format editor code"
                onClick={this.props.increaseFontSize}
              />
            </Tooltip>
            <Tooltip content={"Decrease Font Size"} position="left">
              <IconButton
                icon="minus"
                aria-label="format editor code"
                onClick={this.props.decreaseFontSize}
              />
            </Tooltip>
            <Tooltip content={"Toggle High Contrast Mode"} position="left">
              <IconButton
                icon="contrast"
                aria-label="toggle high contrast mode"
                onClick={this.props.toggleHighContrastMode}
              />
            </Tooltip>
          </ButtonGroup>
          <ButtonGroup vertical>
            {this.state.code !== challenge.starterCode &&
              !isEditMode &&
              !isSandbox && (
                <Tooltip content={"Restore Initial Code"} position="left">
                  <IconButton
                    icon="reset"
                    aria-label="reset editor"
                    onClick={this.resetCodeWindow}
                  />
                </Tooltip>
              )}
            <Tooltip content={"Format Code"} position="left">
              <IconButton
                icon="style"
                aria-label="format editor code"
                onClick={this.handleFormatCode}
              />
            </Tooltip>
            {!isSandbox && (
              <Tooltip
                content={fullScreenEditor ? "Regular" : "Full Screen"}
                position="left"
              >
                <IconButton
                  aria-label="fullscreen editor"
                  onClick={this.toggleEditorType}
                  icon={fullScreenEditor ? "collapse-all" : "expand-all"}
                />
              </Tooltip>
            )}
          </ButtonGroup>
        </LowerRight>
        <div id="monaco-editor" style={{ height: "100%" }} />
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
                {!isFullScreen ? (
                  <RowsWrapper separatorProps={rowSeparatorProps}>
                    <Row
                      initialHeight={D.CHALLENGE_CONTENT_HEIGHT}
                      style={{ background: C.BACKGROUND_CONTENT }}
                    >
                      <ContentContainer>
                        <ContentViewEdit />
                      </ContentContainer>
                    </Row>
                    <Row
                      initialHeight={D.EDITOR_HEIGHT}
                      style={{ background: C.BACKGROUND_EDITOR }}
                    >
                      {MONACO_CONTAINER}
                    </Row>
                    <Row
                      initialHeight={D.TEST_CONTENT_HEIGHT}
                      style={{ background: C.BACKGROUND_CONTENT }}
                    >
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
                      </TabbedInnerNav>
                      {this.props.isEditMode &&
                      this.props.adminTestTab === "testCode" ? (
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
                    </Row>
                  </RowsWrapper>
                ) : (
                  <div
                    style={{ height: "100%", background: C.BACKGROUND_CONSOLE }}
                  >
                    {MONACO_CONTAINER}
                  </div>
                )}
              </Col>
              {IS_REACT_CHALLENGE ? (
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
    const { testResults } = this.state;
    const passedTests = testResults.filter(t => t.testResult);
    const correct = passedTests.length === testResults.length;
    return { correct, passedTests, testResults };
  };

  getTestSummaryString = () => {
    const { passedTests, testResults } = this.getTestPassedStatus();
    return `Tests: ${passedTests.length}/${testResults.length} Passed`;
  };

  setMonacoEditorValue = () => {
    const models = this.monacoWrapper.editor.getModels();
    const model = models[0];
    model.setValue(this.state.code);
  };

  setMonacoEditorTheme = (theme: string) => {
    if (this.monacoWrapper) {
      this.monacoWrapper.editor.setTheme(theme);
      this.debouncedSyntaxHighlightFunction(this.state.code);
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
      this.monacoWrapper.languages.typescript.typescriptDefaults.addExtraLib(
        moduleDeclarations,
      );
    }
  };

  requestSyntaxHighlighting = (code: string) => {
    if (this.syntaxWorker) {
      this.syntaxWorker.postMessage({ code });
    }
  };

  handleEditorContentChange = (_: any) => {
    const models = this.monacoWrapper.editor.getModels();
    const model = models[0];
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
      this.debouncedRenderPreviewFunction();
      this.debouncedSyntaxHighlightFunction(code);
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
      this.updateWorkspaceConsole({ data, method });
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
          AppToaster.clear(); /* Clear existing toasts */
          AppToaster.show({
            icon: "issue",
            intent: "warning",
            message: "Please check your code for infinite loops!",
          });
          break;
        }
        case IFRAME_MESSAGE_TYPES.TEST_RESULTS: {
          const results = JSON.parse(message);
          if (!Array.isArray(results)) {
            console.warn("[bad things]", results);
            break;
          }
          this.setState(
            { testResults: results },
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
    if (correct) {
      this.handlePassChallenge();
    }
  };

  handlePassChallenge = () => {
    /**
     * Called when all the tests on a challenge pass. This can be used to
     * trigger events at this time such as displaying the challenge success
     * modal.
     */
    this.props.handleCompleteChallenge(this.props.challenge.id);
  };

  iFrameRenderPreview = async () => {
    this.setState(
      { logs: DEFAULT_LOGS },
      async (): Promise<void> => {
        if (!this.iFrameRef || !this.iFrameRef.contentWindow) {
          console.warn("[iframe] Not yet mounted");
          return;
        }

        /**
         * Process the code string and create an HTML document to render
         * to the iframe.
         */
        if (this.props.challenge.type === "markup") {
          const testScript = getTestScripts(
            this.props.challenge.testCode,
            EXPECTATION_LIB,
          );

          // NOTE: Tidy html should ensure there is indeed a closing body tag
          const tidySource = tidyHtml(this.state.code);

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
          const sourceDocument = tidySource.replace(
            "</body>",
            `${testScript}</body>`,
          );

          this.iFrameRef.srcdoc = sourceDocument;
        } else {
          try {
            const code = await this.compileAndTransformCodeString();
            const sourceDocument = getMarkupForCodeChallenge(
              code,
              EXPECTATION_LIB,
            );
            this.iFrameRef.srcdoc = sourceDocument;
          } catch (err) {
            this.handleCompilationError(err);
          }
        }
      },
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
    const log = Decode([
      {
        method: "error",
        data: [error.message],
      },
    ]);
    this.updateWorkspaceConsole(log);
  };

  updateWorkspaceConsole = (log: Log) => {
    this.setState(
      ({ logs }) => ({
        logs: [...logs, this.transformUndefinedLogMessages(log)],
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

  transformUndefinedLogMessages = (log: Log) => {
    const { method, data } = log;
    const withUndefined = data.map(value => {
      if (value === "__transform_undefined__") {
        return undefined;
      }

      return value;
    });

    return {
      method,
      data: withUndefined,
    };
  };

  handleKeyPress = (event: KeyboardEvent) => {
    if (event.key === "Meta" && event.keyCode === 91) {
      this.iFrameRenderPreview();
    }
  };

  toggleEditorType = () => {
    this.setState(
      x => ({ fullScreenEditor: !x.fullScreenEditor }),
      this.resetMonacoEditor,
    );
  };

  resetMonacoEditor = () => {
    this.cleanupEditor();
    this.initializeMonacoEditor();
  };

  setIframeRef = (ref: HTMLIFrameElement) => {
    this.iFrameRef = ref;
  };

  private readonly disposeModels = () => {
    /* ??? */
    if (this.monacoWrapper) {
      const models = this.monacoWrapper.editor.getModels();
      for (const model of models) {
        model.dispose();
      }
    }
  };

  /**
   * Cleanup monaco editor resources
   */
  private readonly cleanupEditor = () => {
    this.disposeModels();
    this.editorInstance = null;
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
}

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  challenge: Modules.selectors.challenges.getCurrentChallenge(state),
  isEditMode: Modules.selectors.challenges.isEditMode(state),
  isUserLoading: Modules.selectors.user.loading(state),
  userSettings: Modules.selectors.user.userSettings(state),
  editorOptions: Modules.selectors.user.editorOptions(state),
  blob: Modules.selectors.challenges.getBlobForCurrentChallenge(state),
  isLoadingBlob: Modules.selectors.challenges.isLoadingBlob(state),
  adminTestTab: Modules.selectors.challenges.adminTestTabSelector(state),
  adminEditorTab: Modules.selectors.challenges.adminEditorTabSelector(state),
});

const dispatchProps = {
  updateChallenge: Modules.actions.challenges.updateChallenge,
  updateUserSettings: Modules.actions.user.updateUserSettings,
  handleCompleteChallenge: Modules.actions.challenges.handleCompleteChallenge,
  updateCurrentChallengeBlob:
    Modules.actions.challenges.updateCurrentChallengeBlob,
  setAdminTestTab: Modules.actions.challenges.setAdminTestTab,
  setAdminEditorTab: Modules.actions.challenges.setAdminEditorTab,
};

const mergeProps = (
  state: ReturnType<typeof mapStateToProps>,
  methods: typeof dispatchProps,
  props: {},
) => ({
  ...props,
  ...methods,
  ...state,
  toggleHighContrastMode: () =>
    methods.updateUserSettings({
      theme:
        state.userSettings.theme === MonacoEditorThemes.DEFAULT
          ? MonacoEditorThemes.HIGH_CONTRAST
          : MonacoEditorThemes.DEFAULT,
    }),
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
      return <h1>Loading...</h1>;
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

    const { type } = challenge;
    const contentOnlyChallenge = type === "media" || type === "section";
    const challengeRequiresWorkspace = !contentOnlyChallenge;

    return (
      <React.Fragment>
        {challengeRequiresWorkspace && (
          <Workspace {...this.props} blob={codeBlob} challenge={challenge} />
        )}
        {challenge.id !== SANDBOX_ID && (
          <LowerSection withHeader={challenge.type === "media"}>
            <MediaArea />
          </LowerSection>
        )}
      </React.Fragment>
    );
  }
}

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default composeWithProps<{}>(withProps)(WorkspaceLoadingContainer);
