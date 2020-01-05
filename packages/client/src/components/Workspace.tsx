// Import Workers:
// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import CodeFormatWorker from "workerize-loader!../tools/prettier-code-formatter";
// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import SyntaxHighlightWorker from "workerize-loader!../tools/tsx-syntax-highlighter";

import IconButton from "@material-ui/core/IconButton";
import FormatLineSpacing from "@material-ui/icons/FormatLineSpacing";
import Fullscreen from "@material-ui/icons/Fullscreen";
import FullscreenExit from "@material-ui/icons/FullscreenExit";
import SettingsBackupRestore from "@material-ui/icons/SettingsBackupRestore";
import { monaco } from "@monaco-editor/react";
import { assertUnreachable, Challenge } from "@prototype/common";
import { Console, Decode } from "console-feed";
import Modules, { ReduxStoreState } from "modules/root";
import pipe from "ramda/es/pipe";
import React, { ChangeEvent, useEffect, useState } from "react";
import { Col, ColsWrapper, Row, RowsWrapper } from "react-grid-resizable";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import { debounce } from "throttle-debounce";
import { DEV_MODE } from "tools/client-env";
import {
  getTestCodeMarkup,
  TestCase,
  TestCaseMarkup,
  TestCaseReact,
  TestCaseTypeScript,
} from "../tools/challenges";
import {
  COLORS,
  COLORS as C,
  DIMENSIONS as D,
  HEADER_HEIGHT,
  MONACO_EDITOR_THEME,
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
  saveCodeToLocalStorage,
  wait,
} from "../tools/utils";
import ChallengeTestEditor from "./ChallengeTestEditor";
import KeyboardShortcuts from "./KeyboardShortcuts";
import MediaArea from "./MediaArea";
import {
  ContentInput,
  StyledMarkdown,
  StyledTooltip,
  TitleInput,
} from "./shared";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */
const codeWorker = new CodeFormatWorker();

enum IFRAME_MESSAGE_TYPES {
  LOG = "LOG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  TEST_RESULTS = "TEST_RESULTS",
}

interface IframeMessageEvent extends MessageEvent {
  data: {
    message: string;
    source: IFRAME_MESSAGE_TYPES;
  };
}

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
  tests: ReadonlyArray<TestCase>;
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

    const tests = JSON.parse(this.props.challenge.testCode);

    this.state = {
      tests,
      logs: DEFAULT_LOGS,
      fullScreenEditor: false,
      monacoInitializationError: false,
      adminEditorTab: "starterCode",
      adminTestTab: "testResults",
      code: this.getEditorCode(props.challenge),
    };
  }

  // This is only to allow a logic split if editting (i.e. via admin edit mode).
  getEditorCode = (
    challenge: Challenge = this.props.challenge,
    isEditMode = this.props.isEditMode,
  ) => {
    if (isEditMode) {
      return challenge[this.state.adminEditorTab];
    } else {
      return getStoredCodeForChallenge(challenge);
    }
  };

  async componentDidMount() {
    document.addEventListener("keydown", this.handleKeyPress);
    window.addEventListener(
      "message",
      this.handleReceiveMessageFromCodeRunner,
      false,
    );

    codeWorker.addEventListener("message", this.handleCodeFormatMessage);

    /* Initialize Monaco Editor and the SyntaxHighlightWorker */
    this.initializeMonaco();
    this.initializeSyntaxHighlightWorker();

    /* Handle some timing issue with Monaco initialization... */
    await wait(500);
    this.iFrameRenderPreview();
    this.debouncedSyntaxHighlightFunction(this.state.code);
  }

  componentWillUnmount() {
    this.disposeModels();
    window.removeEventListener("keydown", this.handleKeyPress);
    window.removeEventListener(
      "message",
      this.handleReceiveMessageFromCodeRunner,
    );
    codeWorker.removeEventListener("message", this.handleCodeFormatMessage);
  }

  refreshEditor = () => {
    this.props.unlockVerticalScrolling();
    this.resetMonacoEditor();
    this.setMonacoEditorValue();
  };

  componentWillReceiveProps(nextProps: IProps) {
    // Update in response to changing challenge
    if (this.props.challenge.id !== nextProps.challenge.id) {
      const { challenge } = nextProps;
      const tests = JSON.parse(challenge.testCode);
      const newCode = this.getEditorCode(challenge);
      this.setState(
        { code: newCode, tests, adminTestTab: "testResults" },
        this.refreshEditor,
      );
    }

    // Update in response to toggling admin edit mode. This will only ever
    // happen for us as we use codepress, not for our end users.
    if (this.props.isEditMode !== nextProps.isEditMode) {
      this.setState(
        { code: this.getEditorCode(nextProps.challenge, nextProps.isEditMode) },
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
   */
  handleEditorTabClick = (tab: IState["adminEditorTab"]) => {
    if (tab !== this.state.adminEditorTab) {
      this.setState(
        {
          adminEditorTab: tab,
          code: this.props.challenge[tab],
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
        this.setState({
          adminTestTab: tab,
          tests: JSON.parse(this.props.challenge.testCode), // See NOTE
        });
      } else {
        this.setState({ adminTestTab: tab });
      }
    }
  };

  render() {
    const { fullScreenEditor, tests } = this.state;
    const { challenge, isEditMode } = this.props;
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
        <LowerRight
          style={{ right: 10, display: "flex", flexDirection: "column" }}
        >
          {this.state.code !== challenge.starterCode && !isEditMode && (
            <StyledTooltip title={"Restore Initial Code"} placement="left">
              <IconButton
                style={{ color: "white" }}
                aria-label="reset editor"
                onClick={this.resetCodeWindow}
              >
                <SettingsBackupRestore />
              </IconButton>
            </StyledTooltip>
          )}
          <StyledTooltip title={"Format Code"} placement="left">
            <IconButton
              style={{ color: "white" }}
              aria-label="format editor code"
              onClick={this.requestCodeFormatting}
            >
              <FormatLineSpacing />
            </IconButton>
          </StyledTooltip>
          <StyledTooltip
            title={fullScreenEditor ? "Regular" : "Full Screen"}
            placement="left"
          >
            <IconButton
              style={{ color: "white" }}
              aria-label="fullscreen editor"
              onClick={this.toggleEditorType}
            >
              {fullScreenEditor ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
          </StyledTooltip>
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
                {!fullScreenEditor ? (
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
                          {tests.map(this.renderTestResult)}
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
    const { tests } = this.state;
    const passed = tests.filter(t => t.testResult);
    return `Tests: ${passed.length}/${tests.length} Passed`;
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
      case "typescript": {
        const { input } = t as TestCaseTypeScript;
        return (
          <ContentText
            key={i}
            style={{ display: "flex", flexDirection: "row" }}
          >
            <div style={{ width: 450 }}>
              <b style={{ color: C.TEXT_TITLE }}>Input: </b>
              {input.map(JSON.stringify).join(", ")}
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
      case "markup": {
        const { message } = t as TestCaseMarkup;
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
    saveCodeToLocalStorage(this.props.challenge.id, this.state.code);
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
          const testCasesCopy = this.state.tests.slice();
          for (let i = 0; i < results.length; i++) {
            testCasesCopy[i].testResult = results[i];
          }
          this.setState({ tests: testCasesCopy });
          break;
        }
        default: {
          assertUnreachable(source);
        }
      }
    } catch (err) {
      // no-op
    }
  };

  iFrameRenderPreview = async () => {
    const makeElementFactory = (
      createElement: typeof document.createElement,
    ) => {
      return (tag: string, props: any) => {
        const el = createElement(tag);
        Object.keys(props).forEach(k => {
          const v = props[k];
          // @ts-ignore
          el[k] = v;
        });
        return el;
      };
    };

    // console.clear();
    this.setState({ logs: DEFAULT_LOGS }, async () => {
      if (this.iFrameRef && this.iFrameRef.contentWindow) {
        try {
          /**
           * Process the code string and create an HTML document to render
           * to the iframe.
           */
          if (this.props.challenge.type === "markup") {
            this.iFrameRef.srcdoc = this.state.code;

            /**
             * Wait to allow the iframe to render the new HTML document
             * before appending and running the test script.
             */
            await wait(50);

            // Don't forget to bind createElement... not sure typescript can protect us form this one
            const el = makeElementFactory(
              this.iFrameRef.contentWindow.document.createElement.bind(
                this.iFrameRef.contentWindow.document,
              ),
            );

            const markupTests = getTestCodeMarkup(this.state.tests);

            const testScript = el("script", {
              id: "test-script",
              type: "text/javascript",
              innerHTML: markupTests,
            });

            this.iFrameRef.contentWindow.document.body.appendChild(testScript);
          } else {
            const code = await this.compileAndTransformCodeString();
            const sourceDocument = getMarkupForCodeChallenge(code);
            this.iFrameRef.srcdoc = sourceDocument;
          }
        } catch (err) {
          this.handleCompilationError(err);
        }
      }
    });
  };

  compileAndTransformCodeString = async () => {
    const { code, dependencies } = stripAndExtractModuleImports(
      this.state.code,
    );

    this.addModuleTypeDefinitionsToMonaco(dependencies);

    const injectModuleDependenciesFn = createInjectDependenciesFunction(
      this.props.challenge.type === "react"
        ? [...dependencies, "react-dom-test-utils"]
        : dependencies,
    );

    const injectTestCodeFn = injectTestCode(this.props.challenge);

    /**
     * What happens here:
     *
     * - Inject test code in code string, and remove any console methods
     * - Hijack all console usages in user code string
     * - Transform code with Babel
     * - Fetch and inject required modules into code string
     */
    const processedCodeString = pipe(
      injectTestCodeFn,
      hijackConsole,
      transpileCodeWithBabel,
      injectModuleDependenciesFn,
    )(code);

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
   */
  private readonly handleCodeFormatMessage = (event: MessageEvent) => {
    const code = event.data?.code;
    if (code) {
      this.transformMonacoCode(() => code);
    } else {
      console.warn("[INFO] No code passed via message event", event);
    }
  };

  private readonly requestCodeFormatting = () => {
    try {
      codeWorker.postMessage({
        code: this.state.code,
        type: this.props.challenge.type,
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

// const Title = styled.p`
//   color: ${C.PRIMARY_BLUE};
//   margin: 0;
//   padding: 0;
//   font-size: 18px;
//   font-weight: 300;
// `;

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

// const UpperRight = styled.div`
//   position: absolute;
//   z-index: 2;
//   top: 0;
//   right: 0;
// `;

const LowerRight = styled.div`
  position: absolute;
  z-index: 2;
  bottom: 0;
  right: 0;
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
  const handleChange = (fn: (x: string) => any) => (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    fn(e.target.value);
  };

  const handleTitle = handleChange(title =>
    props.updateChallenge({ id: currentId, challenge: { title } }),
  );
  const handleContent = handleChange(content =>
    props.updateChallenge({ id: currentId, challenge: { content } }),
  );

  return (
    <StyledInputs isEditMode={isEditMode} style={{ height: "100%" }}>
      <TitleInput
        type="text"
        value={props.title}
        onChange={handleTitle}
        disabled={!isEditMode}
      />
      {isEditMode ? (
        <ContentInput value={props.content} onChange={handleContent} />
      ) : (
        <StyledMarkdown source={props.content} />
      )}
    </StyledInputs>
  );
});

const StyledInputs = styled.div<{ isEditMode: boolean }>`
  input,
  textarea {
    border: 1px solid transparent;
    &:hover {
      border-color: ${props =>
        props.isEditMode ? "rgb(0, 255, 185)" : "transparent"};
    }
  }
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
  challenge: Modules.selectors.challenges.firstUnfinishedChallenge(state),
  isEditMode: Modules.selectors.challenges.isEditMode(state),
});

const dispatchProps = {
  updateChallenge: Modules.actions.challenges.updateChallenge,
  toggleScrollLock: Modules.actions.app.toggleScrollLock,
};

interface ComponentProps {}

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

interface WorkspaceLoadingContainerProps extends ComponentProps, ConnectProps {}

interface IProps extends WorkspaceLoadingContainerProps {
  challenge: Challenge;
  unlockVerticalScrolling: () => any;
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

    /* NOTE: Challenge has loaded by the time this component loads: */
    const loadedChallenge = challenge as Challenge;

    return (
      <React.Fragment>
        {loadedChallenge.type !== "media" && (
          <Workspace
            {...this.props}
            challenge={loadedChallenge}
            unlockVerticalScrolling={this.unlockVerticalScrolling}
          />
        )}
        <LowerSection withHeader={loadedChallenge.type === "media"}>
          <MediaArea />
        </LowerSection>
        {DEV_MODE && <AdminKeyboardShortcuts />}
      </React.Fragment>
    );
  }

  unlockVerticalScrolling = () => {
    this.props.toggleScrollLock({ locked: false });
  };
}

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default composeWithProps<ComponentProps>(withProps)(
  WorkspaceLoadingContainer,
);
