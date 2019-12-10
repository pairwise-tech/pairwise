import { monaco } from "@monaco-editor/react";
import { Console, Decode } from "console-feed";
import { pipe } from "ramda";
import React from "react";
import { Col, ColsWrapper, Row, RowsWrapper } from "react-grid-resizable";
import { connect } from "react-redux";
import styled from "styled-components";
import { debounce } from "throttle-debounce";

import { Challenge } from "modules/challenges/types";
import Modules, { ReduxStoreState } from "modules/root";
import {
  TestCase,
  TestCaseReact,
  TestCaseTypeScript,
} from "../tools/challenges";
import {
  COLORS,
  COLORS as C,
  DIMENSIONS as D,
  HEADER_HEIGHT,
} from "../tools/constants";
import { types } from "../tools/jsx-types";
import {
  handleInjectModuleDependencies,
  hijackConsole,
  injectTestCode,
  stripAndExtractImportDependencies,
  transpileCodeWithBabel,
} from "../tools/test-utils";
import {
  assertUnreachable,
  composeWithProps,
  getStarterCodeForChallenge,
  saveCodeToLocalStorage,
  wait,
} from "../tools/utils";
import { Button } from "./Primitives";

// Import TSX SyntaxHighlightWorker:
// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import SyntaxHighlightWorker from "workerize-loader!../tools/tsx-syntax-highlighter";
import NavigationOverlay from "./NavigationOverlay";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

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

  constructor(props: IProps) {
    super(props);

    this.debouncedRenderPreviewFunction = debounce(
      500,
      this.iFrameRenderPreview,
    );

    this.debouncedSaveCodeFunction = debounce(
      50,
      this.handleSaveCodeToLocalStorage,
    );

    const tests = JSON.parse(this.props.challenge.testCode);

    this.state = {
      tests,
      logs: DEFAULT_LOGS,
      fullScreenEditor: false,
      monacoInitializationError: false,
      code: getStarterCodeForChallenge(props.challenge),
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
    this.requestSyntaxHighlighting(this.state.code);
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.handleKeyPress);
    window.removeEventListener(
      "message",
      this.handleReceiveMessageFromCodeRunner,
    );
  }

  componentWillReceiveProps(nextProps: IProps) {
    if (this.props.challenge.id !== nextProps.challenge.id) {
      const { challenge } = nextProps;
      const tests = JSON.parse(challenge.testCode);
      this.setState(
        { code: getStarterCodeForChallenge(challenge), tests },
        () => {
          this.setMonacoEditorValue();
        },
      );
    }
  }

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
    if (!this.monacoEditor) {
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
      theme: "vs-dark",
      automaticLayout: true,
      fixedOverflowWidgets: true,
    };

    const model = mn.editor.createModel(
      this.state.code,
      "typescript",
      new mn.Uri.parse("file:///main.tsx"),
    );

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

  disposeModels = () => {
    const models = this.monacoEditor.editor.getModels();
    for (const model of models) {
      model.dispose();
    }
  };

  render() {
    const { fullScreenEditor, tests } = this.state;
    const { challenge, overlayVisible } = this.props;
    const IS_TYPESCRIPT_CHALLENGE = challenge.type === "typescript";

    const MONACO_CONTAINER = (
      <div style={{ height: "100%" }}>
        <div id="monaco-editor" style={{ height: "100%" }} />
      </div>
    );

    return (
      <Page>
        <Header>
          <Title>Fullstack TypeScript Course</Title>
          <ControlsContainer>
            <Button onClick={this.toggleEditorType}>
              {fullScreenEditor ? "Regular" : "Full Screen"} Editor
            </Button>
            <Button
              onClick={() => this.props.setNavigationMapState(!overlayVisible)}
            >
              {overlayVisible ? "Hide" : "Open"} Navigation
            </Button>
          </ControlsContainer>
        </Header>
        <NavigationOverlay overlayVisible={overlayVisible} />
        <WorkspaceContainer>
          <ColsWrapper separatorProps={separatorProps}>
            <Col
              initialWidth={D.EDITOR_PANEL_WIDTH}
              initialHeight={D.WORKSPACE_HEIGHT}
            >
              {!fullScreenEditor ? (
                <RowsWrapper separatorProps={separatorProps}>
                  <Row
                    initialHeight={D.CHALLENGE_CONTENT_HEIGHT}
                    style={{ background: C.BACKGROUND_CONTENT }}
                  >
                    <ContentContainer>
                      <ContentTitle>{challenge.title}</ContentTitle>
                      <ContentText>{challenge.content}</ContentText>
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
                    <ContentContainer>
                      <ContentTitle style={{ marginBottom: 12 }}>
                        {this.getTestSummaryString()}
                      </ContentTitle>
                      {tests.map(this.renderTestResult)}
                    </ContentContainer>
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
            {IS_TYPESCRIPT_CHALLENGE ? (
              <Col style={consoleRowStyles} initialHeight={D.WORKSPACE_HEIGHT}>
                <div>
                  <Console variant="dark" logs={this.state.logs} />
                  <FrameContainer
                    id="iframe"
                    title="code-preview"
                    ref={this.setIframeRef}
                    style={{ visibility: "hidden", height: 0, width: 0 }}
                  />
                </div>
              </Col>
            ) : (
              <Col>
                <RowsWrapper separatorProps={separatorProps}>
                  <Row initialHeight={D.PREVIEW_HEIGHT}>
                    <div>
                      <FrameContainer
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
            )}
          </ColsWrapper>
        </WorkspaceContainer>
      </Page>
    );
  }

  getTestSummaryString = () => {
    const { tests } = this.state;
    const passed = tests.filter(t => t.testResult);
    return `Tests: ${passed.length}/${tests.length} Passed`;
  };

  renderTestResult = (t: TestCase, i: number) => {
    const challengeType = this.props.challenge.type;
    if (challengeType === "react") {
      const { message } = t as TestCaseReact;
      return (
        <ContentText key={i} style={{ display: "flex", flexDirection: "row" }}>
          <div style={{ width: 450 }}>
            <b style={{ color: C.TEXT_TITLE }}>Test: </b>
            {message}
          </div>
          <div style={{ display: "flex", flexDirection: "row" }}>
            <b style={{ color: C.TEXT_TITLE }}>Status:</b>
            <SuccessFailureText testResult={t.testResult}>
              {t.testResult ? "Success!" : "Failure..."}
            </SuccessFailureText>
          </div>
        </ContentText>
      );
    } else if (challengeType === "typescript") {
      const { input } = t as TestCaseTypeScript;
      return (
        <ContentText key={i} style={{ display: "flex", flexDirection: "row" }}>
          <div style={{ width: 450 }}>
            <b style={{ color: C.TEXT_TITLE }}>Input: </b>
            {JSON.stringify(input)}
          </div>
          <div style={{ display: "flex", flexDirection: "row" }}>
            <b style={{ color: C.TEXT_TITLE }}>Status:</b>
            <SuccessFailureText testResult={t.testResult}>
              {t.testResult ? "Success!" : "Failure..."}
            </SuccessFailureText>
          </div>
        </ContentText>
      );
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
      this.requestSyntaxHighlighting(code);
      this.debouncedSaveCodeFunction();
      this.debouncedRenderPreviewFunction();
    });
  };

  handleSaveCodeToLocalStorage = () => {
    /**
     * Save the current code to local storage. This method is debounced.
     */
    saveCodeToLocalStorage(this.props.challenge.id, this.state.code);
  };

  handleReceiveMessageFromCodeRunner = (event: IframeMessageEvent) => {
    const handleLogMessage = (message: any, method: ConsoleLogMethods) => {
      const msg = JSON.parse(message);
      const data: ReadonlyArray<any> = [msg];
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

  iFrameRenderPreview = () => {
    // console.clear();
    this.setState({ logs: DEFAULT_LOGS }, async () => {
      if (this.iFrameRef) {
        try {
          /**
           * Process the code string and create an HTML document to render
           * to the iframe.
           */
          const code = await this.compileAndTransformCodeString();
          const IFRAME_HTML_DOCUMENT = getHTML(code);

          /**
           * Insert the HTML document into the iframe.
           */
          this.iFrameRef.srcdoc = IFRAME_HTML_DOCUMENT;
        } catch (err) {
          this.handleCompilationError(err);
        }
      }
    });
  };

  compileAndTransformCodeString = async () => {
    const { code, dependencies } = stripAndExtractImportDependencies(
      this.state.code,
    );

    this.addModuleTypeDefinitionsToMonaco(dependencies);

    const injectModuleDependenciesFn = handleInjectModuleDependencies(
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
        const message = data[0];

        /**
         * Send logs directly to the browser console as well. This feature
         * could be toggled on or off, or just on by default.
         */
        switch (method) {
          case "log":
            return console.log(message);
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
      () => {
        this.disposeModels();
        this.initializeMonacoEditor();
      },
    );
  };

  // toggleChallengeType = () => {
  //   this.setState(x => {
  //     const challengeType =
  //       x.challengeType === "react" ? "typescript" : "react";
  //     return {
  //       challengeType,
  //       tests: getTestCases(challengeType),
  //     };
  //   }, this.updateCodeWhenChallengeTypeChanged);
  // };

  // updateCodeWhenChallengeTypeChanged = () => {
  //   this.setState(
  //     x => ({
  //       code: getStarterCodeForChallenge(x.challengeType),
  //     }),
  //     () => {
  //       this.setMonacoEditorValue();
  //       this.iFrameRenderPreview();
  //     },
  //   );
  // };

  setIframeRef = (ref: HTMLIFrameElement) => {
    this.iFrameRef = ref;
  };
}

/** ===========================================================================
 * Styled Components
 * ============================================================================
 */

const Page = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: white;
`;

const Header = styled.div`
  height: ${HEADER_HEIGHT}px;
  width: calc(100vw - 48);
  padding-left: 24px;
  padding-right: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid ${C.HEADER_BORDER};
  background: ${C.BACKGROUND_HEADER};
  background: linear-gradient(
    63deg,
    rgba(2, 6, 10, 1) 25%,
    rgba(17, 38, 59, 1) 68%,
    rgba(30, 20, 55, 1) 92%
  );
`;

const Title = styled.p`
  color: ${C.PRIMARY_BLUE};
  margin: 0;
  padding: 0;
  margin-top: 8px;
  font-size: 18px;
  font-weight: 300;
`;

const WorkspaceContainer = styled.div`
  height: 100%;
  width: 100%;
`;

const FrameContainer = styled.iframe`
  height: 100%;
  width: 100%;
  border: none;
`;

const consoleRowStyles = {
  paddingTop: 2,
  paddingBottom: 4,
  background: C.BACKGROUND_CONSOLE,
};

const separatorProps = {
  style: {
    backgroundColor: C.DRAGGABLE_SLIDER,
  },
};

const ContentContainer = styled.div`
  padding: 8px;
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

const ControlsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: row;
`;

const SuccessFailureText = styled.p`
  margin: 0;
  margin-left: 4px;
  color: ${(props: { testResult: boolean }) =>
    props.testResult ? C.SUCCESS : C.FAILURE};
`;

const LoadingOverlay = styled.div`
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  z-index: 999;
  position: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.95);
  visibility: ${(props: { visible: boolean }) =>
    props.visible ? "visible" : "hidden"};
`;

const OverlayLoadingText = styled.p`
  margin: 0;
  font-size: 42px;
  font-weight: 200;
  color: ${COLORS.PRIMARY_BLUE};
`;

/**
 * Get the full html content string for the iframe, injected the user code
 * into it. This currently includes script libraries now.
 */
const getHTML = (js: string) => `
<html>
  <head></head>
  <body>
    <div id="root" />
    <script>${js}</script>
  </body>
</html>
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  challenge: Modules.selectors.challenges.firstUnfinishedChallenge(state),
  overlayVisible: Modules.selectors.challenges.navigationOverlayVisible(state),
  workspaceLoading: Modules.selectors.challenges.workspaceLoadingSelector(
    state,
  ),
});

const dispatchProps = {
  setNavigationMapState: Modules.actions.challenges.setNavigationMapState,
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
      return this.renderLoadingOverlay();
    }

    return (
      <React.Fragment>
        {this.renderLoadingOverlay()}
        <Workspace {...this.props} challenge={challenge} />
      </React.Fragment>
    );
  }

  renderLoadingOverlay = () => {
    return (
      <LoadingOverlay visible={this.props.workspaceLoading}>
        <OverlayLoadingText>Initializing Workspace...</OverlayLoadingText>
      </LoadingOverlay>
    );
  };
}

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default composeWithProps<ComponentProps>(withProps)(
  WorkspaceLoadingContainer,
);
