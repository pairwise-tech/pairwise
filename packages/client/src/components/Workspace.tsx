// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import SyntaxHighlightWorker from "workerize-loader!../tools/tsx-syntax-highlighter";

import { monaco } from "@monaco-editor/react";
import { assertUnreachable, Challenge } from "@pairwise/common";
import { Console, Decode } from "console-feed";
import Modules, { ReduxStoreState } from "modules/root";
import pipe from "ramda/es/pipe";
import React, { useEffect, useState } from "react";
import { Col, ColsWrapper, Row, RowsWrapper } from "react-grid-resizable";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import { debounce } from "throttle-debounce";
import { DEV_MODE } from "tools/client-env";
import {
  getTestHarness,
  IFRAME_MESSAGE_TYPES,
  IframeMessageEvent,
  makeElementFactory,
  requestCodeFormatting,
  subscribeCodeWorker,
  TestCase,
  TestCaseMarkupTypescript,
  TestCaseReact,
  unsubscribeCodeWorker,
} from "../tools/challenges";
import {
  COLORS,
  COLORS as C,
  DIMENSIONS as D,
  HEADER_HEIGHT,
  MONACO_EDITOR_THEME,
  SANDBOX_ID,
} from "../tools/constants";
import { types } from "../tools/jsx-types";
import {
  createInjectDependenciesFunction,
  getMarkupForCodeChallenge,
  hijackConsole,
  injectTestCode,
  stripAndExtractModuleImports,
  transpileCodeWithBabel,
} from "../tools/test-utils";
import {
  composeWithProps,
  getStoredCodeForChallenge,
  persistToLocalStorage,
  wait,
} from "../tools/utils";
import ChallengeTestEditor from "./ChallengeTestEditor";
import KeyboardShortcuts from "./KeyboardShortcuts";
import MediaArea from "./MediaArea";
import { ContentInput, LowerRight, StyledMarkdown, IconButton } from "./shared";
import { Tooltip, ButtonGroup, EditableText } from "@blueprintjs/core";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

/**
 * This is only to allow a logic split if editting (i.e. via admin edit mode).
 * So it is not relevant unless using codepress
 */
const getEditorCode = ({
  challenge,
  isEditMode,
  tab = "starterCode",
}: {
  challenge: Challenge;
  isEditMode: boolean;
  tab: IState["adminEditorTab"];
}) => {
  if (isEditMode) {
    return challenge[tab];
  } else {
    return getStoredCodeForChallenge(challenge);
  }
};

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
  adminEditorTab: "starterCode" | "solutionCode";
  adminTestTab: "testResults" | "testCode";
  logs: ReadonlyArray<{ data: ReadonlyArray<any>; method: string }>;
}

/** ===========================================================================
 * React Component
 * ============================================================================
 */

class Workspace extends React.Component<IProps, IState> {
  syntaxWorker: any = null;
  monacoEditor: any = null;
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

    const defaultAdminTab: IState["adminEditorTab"] = "starterCode";

    this.state = {
      testResults: [],
      logs: DEFAULT_LOGS,
      fullScreenEditor: false,
      monacoInitializationError: false,
      adminEditorTab: defaultAdminTab,
      adminTestTab: "testResults",
      code: getEditorCode({
        challenge: props.challenge,
        isEditMode: this.props.isEditMode,
        tab: defaultAdminTab,
      }),
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
    this.disposeModels();
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
    // Update in response to changing challenge
    if (this.props.challenge.id !== nextProps.challenge.id) {
      const { challenge, isEditMode } = nextProps;
      const newCode = getEditorCode({
        challenge,
        isEditMode,
        tab: this.state.adminEditorTab,
      });
      this.setState(
        { code: newCode, adminTestTab: "testResults" },
        this.refreshEditor,
      );
    }

    // Account for changing the challenge type in the sandbox. Otherwise nothing
    // gets rerendered since the ID of the challenge does not change
    // TODO: This is ugly because it's unclear why re-rendering immediately fails
    if (this.props.challenge.type !== nextProps.challenge.type) {
      wait(50).then(this.refreshEditor);
    }

    // Update in response to toggling admin edit mode. This will only ever
    // happen for us as we use codepress, not for our end users.
    if (this.props.isEditMode !== nextProps.isEditMode) {
      this.setState(
        {
          code: getEditorCode({
            challenge: nextProps.challenge,
            isEditMode: nextProps.isEditMode,
            tab: this.state.adminEditorTab,
          }),
        },
        this.refreshEditor,
      );
    }
  }

  /**
   * Resest the code editor content to the starterCode.
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
    if (!this.monacoEditor || this.props.challenge.type === "markup") {
      return;
    }

    const decorations = classifications.map(c => {
      /**
       * NOTE: Custom classNames to allow custom styling for the
       * editor theme:
       */
      const inlineClassName = c.type
        ? `${c.kind} ${c.type}-of-${c.parentKind}`
        : c.kind;

      return {
        range: new this.monacoEditor.Range(
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

    const models = this.monacoEditor.editor.getModels();
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

        this.monacoEditor = mn;

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
    const mn = this.monacoEditor;

    const options = {
      theme: MONACO_EDITOR_THEME,
      automaticLayout: true,
      fixedOverflowWidgets: true,
      minimap: {
        enabled: false,
      },
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

    mn.editor.create(document.getElementById("monaco-editor"), {
      ...options,
      model,
    });

    /**
     * This is a separate model which provides JSX type information. See
     * this for more details: https://github.com/cancerberoSgx/jsx-alone/blob/master/jsx-explorer/HOWTO_JSX_MONACO.md.
     */
    mn.editor.createModel(
      types,
      "typescript",
      mn.Uri.parse("file:///index.d.ts"),
    );
  };

  getMonacoLanguageFromChallengeType = () => {
    const { type } = this.props.challenge;

    if (type === "react" || type === "typescript") {
      return "typescript";
    } else if (type === "markup") {
      return "html";
    }
  };

  disposeModels = () => {
    /* ??? */
    if (this.monacoEditor) {
      const models = this.monacoEditor.editor.getModels();
      for (const model of models) {
        model.dispose();
      }
    }
  };

  /**
   * Switching tabs in the main code area, so that we can edit the starter code and solution code of a challenge.
   * Doing a check to see if we even need to update state. Normally we would
   * just do a fire-and-forget state update regardless, but with all the
   * imperative logic going on with the editor this keeps it from updating
   * unecessarily.
   *
   * NOTE: When switching to the solution code default to start code
   */
  handleEditorTabClick = (tab: IState["adminEditorTab"]) => {
    if (tab !== this.state.adminEditorTab) {
      this.setState(
        {
          adminEditorTab: tab,
          code: this.props.challenge[tab] || this.props.challenge.starterCode, // See NOTE
        },
        this.refreshEditor,
      );
    }
  };

  /**
   * Switch tabs in the test area of the workspace. So that we can see test results and write tests using different tabs.
   */
  handleTestTabClick = (tab: IState["adminTestTab"]) => {
    if (tab !== this.state.adminTestTab) {
      // NOTE: The reason for this additonal logic is to "refresh" the test
      // results when one of us clicks back to the test results tab. That tab is
      // the only tab from the perspective of endusers so this should only ever
      // happen when we are editing via codepress.
      if (tab === "testResults") {
        this.setState({ adminTestTab: tab }, this.refreshEditor);
      } else {
        this.setState({ adminTestTab: tab });
      }
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
            active={this.state.adminEditorTab === "starterCode"}
          >
            Starter Code
          </Tab>
          <Tab
            onClick={() => this.handleEditorTabClick("solutionCode")}
            active={this.state.adminEditorTab === "solutionCode"}
          >
            Solution
          </Tab>
        </TabbedInnerNav>
        <LowerRight>
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
                          active={this.state.adminTestTab === "testResults"}
                        >
                          Test Results
                        </Tab>
                        <Tab
                          onClick={() => this.handleTestTabClick("testCode")}
                          active={this.state.adminTestTab === "testCode"}
                        >
                          Test Code
                        </Tab>
                      </TabbedInnerNav>
                      {this.props.isEditMode &&
                      this.state.adminTestTab === "testCode" ? (
                        <ChallengeTestEditor />
                      ) : (
                        <ContentContainer>
                          <ContentTitle style={{ marginBottom: 12 }}>
                            {this.getTestSummaryString()}
                          </ContentTitle>
                          {testResults.map(this.renderTestResult)}
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

  getTestSummaryString = () => {
    const { testResults } = this.state;
    const passed = testResults.filter(t => t.testResult);
    return `Tests: ${passed.length}/${testResults.length} Passed`;
  };

  renderTestResult = (t: TestCase, i: number) => {
    const challengeType = this.props.challenge.type;
    switch (challengeType) {
      case "react": {
        const { message } = t as TestCaseReact;
        return (
          <ContentText
            key={i}
            style={{ display: "flex", flexDirection: "row" }}
          >
            <div style={{ width: 450 }}>
              <b style={{ color: C.TEXT_TITLE }}>Test: </b>
              {message}
            </div>
            <div style={{ display: "flex", flexDirection: "row" }}>
              <b style={{ color: C.TEXT_TITLE }}>Status:</b>
              <SuccessFailureText testResult={t.testResult}>
                {t.testResult ? "Success!" : "Incomplete..."}
              </SuccessFailureText>
            </div>
          </ContentText>
        );
      }
      case "typescript":
      case "markup": {
        const { message } = t as TestCaseMarkupTypescript;
        return (
          <ContentText
            key={i}
            style={{ display: "flex", flexDirection: "row" }}
          >
            <div style={{ width: 450 }}>
              <b style={{ color: C.TEXT_TITLE }}>Input: </b>
              {message}
            </div>
            <div style={{ display: "flex", flexDirection: "row" }}>
              <b style={{ color: C.TEXT_TITLE }}>Status:</b>
              <SuccessFailureText testResult={t.testResult}>
                {t.testResult ? "Success!" : "Incomplete..."}
              </SuccessFailureText>
            </div>
          </ContentText>
        );
      }
      case "media":
        return null;
      default:
        assertUnreachable(challengeType);
    }
  };

  setMonacoEditorValue = () => {
    const models = this.monacoEditor.editor.getModels();
    const model = models[0];
    model.setValue(this.state.code);
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

    if (this.monacoEditor) {
      this.monacoEditor.languages.typescript.typescriptDefaults.addExtraLib(
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
    const models = this.monacoEditor.editor.getModels();
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
          [this.state.adminEditorTab]: this.state.code,
        },
      });

      // Do not store anything to local storage
      return;
    }

    /**
     * Save the current code to local storage. This method is debounced.
     */
    persistToLocalStorage(this.props.challenge.id, {
      code: this.state.code,
      sandboxType: this.props.challenge.type,
    });
  };

  handleReceiveMessageFromCodeRunner = (event: IframeMessageEvent) => {
    const handleLogMessage = (message: any, method: ConsoleLogMethods) => {
      const msg = JSON.parse(message);
      const data: ReadonlyArray<any> = [...msg];
      const log = Decode([
        {
          data,
          method,
        },
      ]);
      this.updateWorkspaceConsole(log);
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
        case IFRAME_MESSAGE_TYPES.TEST_RESULTS: {
          const results = JSON.parse(message);
          if (!Array.isArray(results)) {
            console.warn("[bad things]", results);
            break;
          }
          this.setState({ testResults: results });
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
      // deafult case
    }
  };

  iFrameRenderPreview = async () => {
    this.setState(
      { logs: DEFAULT_LOGS },
      async (): Promise<void> => {
        if (!this.iFrameRef || !this.iFrameRef.contentWindow) {
          console.warn("[iframe] Not yet mounted");
          return;
        }

        // Don't forget to bind createElement... not sure typescript can protect us form this one
        // const el = makeElementFactory(iframeDoc.createElement.bind(iframeDoc));
        const el = makeElementFactory(
          this.iFrameRef.contentWindow.document.createElement.bind(
            this.iFrameRef.contentWindow.document,
          ),
        );

        /**
         * Process the code string and create an HTML document to render
         * to the iframe.
         */
        if (this.props.challenge.type === "markup") {
          // Since the user is writing HTML, set the source doc directly based on their code
          this.iFrameRef.srcdoc = this.state.code;

          /**
           * Wait to allow the iframe to render the new HTML document
           * before appending and running the test script. The iframe will have
           * a document before it has a body, and I didn't find any good way to
           * listen for it to be ready so we are just polling
           */
          let remainingPollAttempts = 50;
          while (this.iFrameRef.contentWindow.document.body === null) {
            console.warn("[iframe] Body not ready. Waiting...");
            await wait(50);
            remainingPollAttempts--;
            if (remainingPollAttempts < 0) {
              throw new Error(
                `[iframe timeout] Did not render after _several_ attempts.`,
              );
            }
          }

          const markupTests = getTestHarness(this.props.challenge.testCode);

          const testScript = el("script", {
            id: "test-script",
            type: "text/javascript",
            innerHTML: markupTests,
          });

          this.iFrameRef.contentWindow.document.body.appendChild(testScript);
        } else {
          try {
            const code = await this.compileAndTransformCodeString();
            const sourceDocument = getMarkupForCodeChallenge(code);
            this.iFrameRef.srcdoc = sourceDocument;
          } catch (err) {
            this.handleCompilationError(err);
          }
        }
      },
    );
  };

  // TODO: Why is this async?
  compileAndTransformCodeString = async () => {
    const { code: sourceCode, dependencies } = stripAndExtractModuleImports(
      this.state.code,
    );

    this.addModuleTypeDefinitionsToMonaco(dependencies);

    const injectModuleDependenciesFn = createInjectDependenciesFunction(
      this.props.challenge.type === "react"
        ? [...dependencies, "react-dom-test-utils"]
        : dependencies,
    );

    /**
     * What happens here:
     *
     * - Inject test code in code string, and remove any console methods
     * - Hijack all console usages in user code string
     * - Transform code with Babel
     * - Fetch and inject required modules into code string
     */
    const processedCodeString = pipe(
      injectTestCode(this.props.challenge.testCode),
      hijackConsole,
      transpileCodeWithBabel,
      injectModuleDependenciesFn,
    )(sourceCode);

    return processedCodeString;
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
    this.disposeModels();
    this.initializeMonacoEditor();
  };

  setIframeRef = (ref: HTMLIFrameElement) => {
    this.iFrameRef = ref;
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
 * Styled Components
 * ============================================================================
 */

const Container = styled.div`
  height: 100%;
  overflow: hidden;
`;

const PageSection = styled.div`
  width: 100vw;
  height: calc(100vh - ${HEADER_HEIGHT}px);
  background: white;
`;

const LowerSection = styled.div<{ withHeader?: boolean }>`
  width: 100vw;
  height: ${props =>
    props.withHeader ? `calc(100vh - ${HEADER_HEIGHT}px)` : "100vh"};
  border-top: 1px solid ${C.DRAGGABLE_SLIDER_BORDER};
  background: ${C.BACKGROUND_LOWER_SECTION};
`;

const WorkspaceContainer = styled.div`
  width: 100vw;
  height: ${D.WORKSPACE_HEIGHT}px;
`;

const FrameContainer = styled.iframe`
  height: 100%;
  width: 100%;
  border: none;
`;

/**
 * Our window resizing library is listening for mouse events on
 * window.document.body, however, when the mouse enters an iframe those events
 * fire on document.body _within the iframe_, which causes resizing issues when
 * the pane in question contains an iframe. This component prevents pointer
 * events within the iframe during a drag if that drag was started outside the
 * iframe.
 *
 * NOTE: This is currently a very specific case, but could be refactored into a
 * HOC if it became necessary for other components.
 */
const DragIgnorantFrameContainer = React.forwardRef(
  ({ style = {}, ...props }: any, ref: any) => {
    const [isDragging, setIsDragging] = useState<boolean>(false);

    useEffect(() => {
      const onMouseDown = () => {
        setIsDragging(true);
      };
      const onMouseUp = () => {
        setIsDragging(false);
      };

      window.document.body.addEventListener("mousedown", onMouseDown);
      window.document.body.addEventListener("mouseup", onMouseUp);

      return () => {
        window.document.body.removeEventListener("mousedown", onMouseDown);
        window.document.body.removeEventListener("mouseup", onMouseUp);
      };
    }, []);

    return (
      <FrameContainer
        ref={ref}
        style={{ ...style, pointerEvents: isDragging ? "none" : "all" }}
        {...props}
      />
    );
  },
);

const consoleRowStyles = {
  paddingTop: 2,
  paddingBottom: 4,
  background: C.BACKGROUND_CONSOLE,
};

const colSeparatorProps = {
  style: {
    backgroundColor: C.DRAGGABLE_SLIDER,
    borderLeft: `1px solid ${C.DRAGGABLE_SLIDER_BORDER}`,
    borderRight: `1px solid ${C.DRAGGABLE_SLIDER_BORDER}`,
  },
};

const rowSeparatorProps = {
  style: {
    backgroundColor: C.DRAGGABLE_SLIDER,
    borderTop: `1px solid ${C.DRAGGABLE_SLIDER_BORDER}`,
    borderBottom: `1px solid ${C.DRAGGABLE_SLIDER_BORDER}`,
  },
};

const ContentContainer = styled.div`
  height: 100%;
  padding: 8px;
  padding-bottom: 16px;
  overflow-y: scroll;
`;

const Spacer = styled.div`
  height: ${(props: { height: number }) => props.height}px;
`;

const ContentTitle = styled.h3`
  margin: 0;
  margin-bottom: 12px;
  color: ${C.TEXT_TITLE};
`;

const ContentText = styled.span`
  margin: 0;
  margin-top: 8px;
  font-size: 15px;
  font-weight: 200px;
  color: ${C.TEXT_CONTENT};
`;

const SuccessFailureText = styled.p`
  margin: 0;
  margin-left: 4px;
  color: ${(props: { testResult: boolean }) =>
    props.testResult ? C.SUCCESS : C.FAILURE};
`;

const TabbedInnerNav = styled.div<{ show: boolean }>`
  display: ${props => (props.show ? "flex" : "none")};
  align-items: center;
  border-bottom: 1px solid black;
`;

const Tab = styled.div<{ active?: boolean }>`
  display: block;
  padding: 7px 20px;
  cursor: pointer;
  position: relative;
  background: ${props => (props.active ? "#1e1e1e" : "transparent")};
  color: ${props => (props.active ? "white" : "gray")};
  border: 1px solid ${props => (props.active ? "black" : "transparent")};
  border-top: 2px solid
    ${props => (props.active ? COLORS.PRIMARY_GREEN : "transparent")};
  border-bottom: none;
  transition: all 0.2s ease-out;

  &:hover {
    color: white;
  }

  &:after {
    content: "";
    display: block;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    height: 1px;
    background: ${props => (props.active ? "#1e1e1e" : "transparent")};
  }
`;

export const LoginSignupText = styled.h1`
  margin-right: 12px;
  margin-left: 12px;
  font-size: 18px;
  font-weight: 200;
  color: ${COLORS.TEXT_TITLE};
  font-family: Helvetica Neue, Lato, sans-serif;
`;

export const LoginSignupTextInteractive = styled(LoginSignupText)`
  :hover {
    cursor: pointer;
    color: ${COLORS.TEXT_HOVER};
  }
`;

const ChallengeTitleHeading = styled.h1`
  font-size: 1.2em;
  background: transparent;
  font-weight: bold;
  color: rgb(200, 200, 200);
  display: block;
  width: 100%;
  line-height: 1.5;
  transition: all 0.2s ease-out;
  &:focus {
    background: black;
  }
`;

const contentMapState = (state: ReduxStoreState) => ({
  content: Modules.selectors.challenges.getCurrentContent(state) || "",
  title: Modules.selectors.challenges.getCurrentTitle(state) || "",
  currentId: Modules.selectors.challenges.getCurrentId(state) || "",
  isEditMode: Modules.selectors.challenges.isEditMode(state),
});

const contentMapDispatch = {
  updateChallenge: Modules.actions.challenges.updateChallenge,
};

type ContentViewEditProps = ReturnType<typeof contentMapState> &
  typeof contentMapDispatch;

const ContentViewEdit = connect(
  contentMapState,
  contentMapDispatch,
)((props: ContentViewEditProps) => {
  const { isEditMode, currentId } = props;
  const handleTitle = (title: string) =>
    props.updateChallenge({ id: currentId, challenge: { title } });
  const handleContent = (content: string) =>
    props.updateChallenge({ id: currentId, challenge: { content } });

  return (
    <div style={{ height: "100%" }}>
      <ChallengeTitleHeading>
        <StyledEditableText
          value={props.title}
          onChange={handleTitle}
          disabled={!isEditMode}
        />
      </ChallengeTitleHeading>
      {isEditMode ? (
        <ContentInput value={props.content} onChange={handleContent} />
      ) : (
        <StyledMarkdown source={props.content} />
      )}
    </div>
  );
});

const StyledEditableText = styled(EditableText)`
  width: 100%;
`;

const keyboardStateToProps = (state: ReduxStoreState) => ({
  isEditMode: Modules.selectors.challenges.isEditMode(state),
  course: Modules.selectors.challenges.getCurrentCourse(state),
});

const keyboardDispatchProps = {
  saveCourse: Modules.actions.challenges.saveCourse,
  setEditMode: Modules.actions.challenges.setEditMode,
};

const mergeProps = (
  state: ReturnType<typeof keyboardStateToProps>,
  methods: typeof keyboardDispatchProps,
) => ({
  ...state,
  ...methods,
  toggleEditMode: (e: KeyboardEvent) => {
    e.preventDefault();
    methods.setEditMode(!state.isEditMode);
  },
  save: (e: KeyboardEvent) => {
    if (!state.isEditMode) {
      return;
    }

    e.preventDefault();
    if (state.course) {
      methods.saveCourse(state.course);
    } else {
      console.warn("[ERROR] No course to save!");
    }
  },
});

const AdminKeyboardShortcuts = connect(
  keyboardStateToProps,
  keyboardDispatchProps,
  mergeProps,
)((props: ReturnType<typeof mergeProps>) => (
  <KeyboardShortcuts
    keymap={{
      "cmd+e": props.toggleEditMode,
      "cmd+s": props.save,
    }}
  />
));

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  challenge: Modules.selectors.challenges.getCurrentChallenge(state),
  isEditMode: Modules.selectors.challenges.isEditMode(state),
});

const dispatchProps = {
  updateChallenge: Modules.actions.challenges.updateChallenge,
};

interface ComponentProps {}

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

interface WorkspaceLoadingContainerProps extends ComponentProps, ConnectProps {}

interface IProps extends WorkspaceLoadingContainerProps {
  challenge: Challenge;
}

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * WorkspaceLoadingContainer
 * ----------------------------------------------------------------------------
 * - A container component to wait for a challenge to be fully initialized
 * before rendering the Workspace, which requires a challenge to exist.
 * ============================================================================
 */

class WorkspaceLoadingContainer extends React.Component<
  WorkspaceLoadingContainerProps,
  {}
> {
  render() {
    const { challenge } = this.props;

    if (!challenge) {
      return <h1>Loading...</h1>;
    }

    return (
      <React.Fragment>
        {challenge.type !== "media" && (
          <Workspace {...this.props} challenge={challenge} />
        )}
        {challenge.id !== SANDBOX_ID && (
          <LowerSection withHeader={challenge.type === "media"}>
            <MediaArea />
          </LowerSection>
        )}
        {DEV_MODE && <AdminKeyboardShortcuts />}
      </React.Fragment>
    );
  }
}

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default composeWithProps<ComponentProps>(withProps)(
  WorkspaceLoadingContainer,
);
