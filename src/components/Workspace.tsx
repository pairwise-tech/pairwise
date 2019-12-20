import IconButton from "@material-ui/core/IconButton";
import Tooltip from "@material-ui/core/Tooltip";
import Fullscreen from "@material-ui/icons/Fullscreen";
import FullscreenExit from "@material-ui/icons/FullscreenExit";
import Menu from "@material-ui/icons/Menu";
import SkipNext from "@material-ui/icons/SkipNext";
import SkipPrevious from "@material-ui/icons/SkipPrevious";
import SettingsBackupRestore from "@material-ui/icons/SettingsBackupRestore";
import { monaco } from "@monaco-editor/react";
import { Console, Decode } from "console-feed";
import { pipe } from "ramda";
import React, { useEffect, useState } from "react";
import { Col, ColsWrapper, Row, RowsWrapper } from "react-grid-resizable";
import { connect } from "react-redux";
import styled from "styled-components";
import { debounce } from "throttle-debounce";

import { Challenge } from "modules/challenges/types";
import Modules, { ReduxStoreState } from "modules/root";
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
  assertUnreachable,
  composeWithProps,
  getStarterCodeForChallenge,
  saveCodeToLocalStorage,
  wait,
} from "../tools/utils";
import { Button, SecondaryButton } from "./Primitives";

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

interface YoutubeEmbedProps {
  url: string;
}

/**
 * Copied the iframe props form the share sheet on youtube.
 */
const YoutubeEmbed = (props: YoutubeEmbedProps) => {
  return (
    <iframe
      title="Youtube Embed"
      width={560}
      height={315}
      src={props.url}
      frameBorder="0"
      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
};

const UpperRight = styled.div`
  position: absolute;
  z-index: 2;
  top: 0;
  right: 0;
`;

const LowerRight = styled.div`
  position: absolute;
  z-index: 2;
  bottom: 0;
  right: 0;
`;

const StyledTooltip = styled(Tooltip)`
  opacity: 0.5;
  transition: opacity 0.2s ease-out;
  &:hover {
    opacity: 1;
  }
`;

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
    this.debouncedSyntaxHighlightFunction(this.state.code);
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
          this.unlockVerticalScrolling();
          this.resetMonacoEditor();
          this.setMonacoEditorValue();
        },
      );
    }
  }

  /**
   * Resest the code editor content to the staretCode
   */
  resetCodeWindow = () => {
    const { challenge } = this.props;
    this.setState({ code: challenge.starterCode }, this.setMonacoEditorValue);
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
      theme: "vs-dark",
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
    const models = this.monacoEditor.editor.getModels();
    for (const model of models) {
      model.dispose();
    }
  };

  render() {
    const { fullScreenEditor, tests } = this.state;
    const { challenge, overlayVisible, nextPrevChallenges } = this.props;
    const { next, prev } = nextPrevChallenges;
    const IS_REACT_CHALLENGE = challenge.type === "react";
    const IS_MARKUP_CHALLENGE = challenge.type === "markup";
    const IS_TYPESCRIPT_CHALLENGE = challenge.type === "typescript";

    const MONACO_CONTAINER = (
      <div style={{ height: "100%", position: "relative" }}>
        <LowerRight
          style={{ right: 10, display: "flex", flexDirection: "column" }}
        >
          {this.state.code !== challenge.starterCode && (
            <StyledTooltip title={"Restor Initial Code"} placement="left">
              <IconButton
                style={{ color: "white" }}
                aria-label="reset editor"
                onClick={this.resetCodeWindow}
              >
                <SettingsBackupRestore />
              </IconButton>
            </StyledTooltip>
          )}
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
          <Header>
            <ControlsContainer>
              <IconButton
                style={{ color: "white", marginRight: 40 }}
                aria-label="Open navigaton map"
                onClick={this.toggleNavigationMap}
              >
                <Menu />
                {/* overlayVisible ? "Hide" : "View" */}
              </IconButton>
              <h1
                style={{
                  fontFamily: `'Helvetica Neue', Lato, sans-serif`,
                  fontWeight: 100,
                  color: "white",
                }}
              >
                Prototype X
              </h1>
            </ControlsContainer>
            <ControlsContainer>
              {prev && (
                <StyledTooltip title="Previous Challenge">
                  <IconButton
                    style={{ color: "white" }}
                    aria-label="Previous Challenge"
                    onClick={() => this.props.selectChallenge(prev.id)}
                  >
                    <SkipPrevious />
                  </IconButton>
                </StyledTooltip>
              )}
              {next && (
                <StyledTooltip title="Next Challenge">
                  <IconButton
                    style={{ color: "white" }}
                    aria-label="Next Challenge"
                    onClick={() => this.props.selectChallenge(next.id)}
                  >
                    <SkipNext />
                  </IconButton>
                </StyledTooltip>
              )}
            </ControlsContainer>
          </Header>
          <NavigationOverlay overlayVisible={overlayVisible} />
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
                        <ContentTitle>{challenge.title}</ContentTitle>
                        <ContentText>{challenge.content}</ContentText>
                        <Spacer height={25} />
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
                        <Spacer height={50} />
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
        <LowerSection>
          <SupplementaryContentContainer>
            <ContentTitle>Supplementary Content Area</ContentTitle>
            <Text>{challenge.supplementaryContent}</Text>
            <Text>
              <b>Video:</b>{" "}
              {challenge.videoUrl ? challenge.videoUrl : "No video available"}
            </Text>
            {challenge.videoUrl && <YoutubeEmbed url={challenge.videoUrl} />}
          </SupplementaryContentContainer>
        </LowerSection>
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

  handleSaveCodeToLocalStorage = () => {
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
    console.clear();
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
            const markupTests = getTestCodeMarkup(this.state.tests);

            const testScript = this.iFrameRef.contentWindow.document.createElement(
              "script",
            );
            testScript.id = "test-script";
            testScript.type = "text/javascript";
            testScript.innerHTML = markupTests;
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

  toggleNavigationMap = () => {
    const { overlayVisible } = this.props;
    if (overlayVisible) {
      this.unlockVerticalScrolling();
    } else {
      this.lockVerticalScrolling();
    }
    this.props.setNavigationMapState(!overlayVisible);
  };

  /* hi */
  lockVerticalScrolling = () => (document.body.style.overflowY = "hidden");
  unlockVerticalScrolling = () => (document.body.style.overflowY = "scroll");
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
  height: 100vh;
  background: white;
`;

const LowerSection = styled.div`
  width: 100vw;
  height: 100vh;
  border-top: 2px solid ${C.HEADER_BORDER};
  background: ${C.BACKGROUND_LOWER_SECTION};
`;

const SupplementaryContentContainer = styled.div`
  padding: 25px;
  padding-left: 12px;
  padding-right: 12px;
`;

const BORDER = 2;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  position: relative;
  padding-top: ${BORDER}px;
  padding-bottom: 0px;
  padding-left: 0px;
  padding-right: 0px;
  margin-bottom: 0;
  background: #212121;
  border-bottom: 1px solid #404040;

  height: ${HEADER_HEIGHT}px;
  width: calc(100vw - 48);

  &:after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: ${BORDER}px;
    background: linear-gradient(
      90deg,
      rgba(0, 255, 177, 1) 22%,
      rgba(0, 255, 211, 1) 74%
    );
  }
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

const Text = styled.p`
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

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  challenge: Modules.selectors.challenges.firstUnfinishedChallenge(state),
  nextPrevChallenges: Modules.selectors.challenges.nextPrevChallenges(state),
  overlayVisible: Modules.selectors.challenges.navigationOverlayVisible(state),
  workspaceLoading: Modules.selectors.challenges.workspaceLoadingSelector(
    state,
  ),
});

const dispatchProps = {
  selectChallenge: Modules.actions.challenges.setChallengeId,
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
