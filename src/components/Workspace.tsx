import { monaco } from "@monaco-editor/react";
import { Console, Decode } from "console-feed";
import { pipe } from "ramda";
import React from "react";
import { Col, ColsWrapper, Row, RowsWrapper } from "react-grid-resizable";
import styled from "styled-components";
import { debounce } from "throttle-debounce";

import {
  getTestCases,
  TestCase,
  TestCaseReact,
  TestCaseTypeScript,
} from "../tools/challenges";
import {
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
  getStarterCodeForChallenge,
  saveCodeToLocalStorage,
  wait,
} from "../tools/utils";

/** ===========================================================================
 * - TODO: Things not done yet for the challenge workspace:
 *
 * HARD:
 * [ ] TSX syntax highlighting!
 * [~] Type definition files: find a way to use actual type definition files...
 * [~] Fetch import modules dynamically: need to find UNPKG links dynamically...
 * [x] TSX syntax support in monaco editor
 * [x] Ability to test React challenges
 * [!] Ability to run React Native challenges (react-native-web?)
 * [!] Ability to run NodeJS challenges (e.g. fs, express, etc.)
 * [!] Ability to run database challenges, (e.g. SQL, Mongo, etc.)
 * [!] Secure iframe environment from infinite loops and other unsafe code, e.g.
 *     remove alert, confirm, and other global functions from the user's code.
 * [ ] Ability to run terminal/shell challenges?
 *
 * EASIER:
 * [ ] Markdown support in challenge content and test results
 * [ ] cmd+enter should run code but not enter a new line in the editor
 * [ ] Syntax/compilation errors should be reported to the workspace console
 * [x] Include console warn and info in console method overrides
 * [x] Don't show test console output in workspace console window
 *
 * ============================================================================
 */

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

export type CHALLENGE_TYPE = "react" | "typescript";

interface IState {
  code: string;
  fullScreenEditor: boolean;
  challengeType: CHALLENGE_TYPE;
  tests: ReadonlyArray<TestCase>;
  monacoInitializationError: boolean;
  logs: ReadonlyArray<{ data: ReadonlyArray<any>; method: string }>;
}

/** ===========================================================================
 * React Component
 * ============================================================================
 */

class Workspace extends React.Component<{}, IState> {
  monacoEditor: any = null;
  iFrameRef: Nullable<HTMLIFrameElement> = null;
  debouncedSaveCodeFunction: () => void;
  debouncedRenderPreviewFunction: () => void;

  constructor(props: {}) {
    super(props);

    this.debouncedRenderPreviewFunction = debounce(
      500,
      this.iFrameRenderPreview,
    );

    this.debouncedSaveCodeFunction = debounce(
      50,
      this.handleSaveCodeToLocalStorage,
    );

    const challengeType = "react";

    this.state = {
      challengeType,
      logs: DEFAULT_LOGS,
      fullScreenEditor: false,
      tests: getTestCases(challengeType),
      monacoInitializationError: false,
      code: getStarterCodeForChallenge(challengeType),
    };
  }

  async componentDidMount() {
    document.addEventListener("keydown", this.handleKeyPress);
    window.addEventListener(
      "message",
      this.handleReceiveMessageFromCodeRunner,
      false,
    );

    this.initializeMonaco();

    /* Handle some timing issue with Monaco initialization... */
    await wait(500);
    this.iFrameRenderPreview();
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.handleKeyPress);
    window.removeEventListener(
      "message",
      this.handleReceiveMessageFromCodeRunner,
    );
  }

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
    const { tests, challengeType, fullScreenEditor } = this.state;
    const IS_TYPESCRIPT_CHALLENGE = challengeType !== "react";

    const MONACO_CONTAINER = (
      <div style={{ height: "100%" }}>
        <div id="monaco-editor" style={{ height: "100%" }} />
      </div>
    );

    return (
      <Page>
        <Header>
          <Title>Zen Coding School</Title>
          <ControlsContainer>
            <Button onClick={this.toggleEditorType}>
              {fullScreenEditor ? "Regular" : "Full Screen"} Editor
            </Button>
            <Button onClick={this.toggleChallengeType}>
              {!IS_TYPESCRIPT_CHALLENGE ? "TypeScript" : "React"} Challenge
            </Button>
          </ControlsContainer>
        </Header>
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
                      <ContentTitle>Challenge</ContentTitle>
                      <ContentText>
                        There is a function in the editor below. It should add
                        two numbers and return the result. Try to complete the
                        function!
                      </ContentText>
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
    const { challengeType } = this.state;
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
    } else {
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

  handleEditorContentChange = (_: any) => {
    const models = this.monacoEditor.editor.getModels();
    const model = models[0];
    const value = model.getValue();

    /**
     * Update the code and then call debounced methods to handle saving the
     * user code to local storage and rendering a preview.
     */
    this.setState({ code: value }, () => {
      this.debouncedSaveCodeFunction();
      this.debouncedRenderPreviewFunction();
    });
  };

  handleSaveCodeToLocalStorage = () => {
    /**
     * Save the current code to local storage. This method is debounced.
     */
    saveCodeToLocalStorage(this.state.code, this.state.challengeType);
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
    console.clear();
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
      this.state.challengeType === "react"
        ? [...dependencies, "react-dom-test-utils"]
        : dependencies,
    );

    const injectTestCodeFn = injectTestCode(this.state.challengeType);

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
        /**
         * Send logs directly to the browser console as well. This feature
         * could be toggled on or off, or just on by default.
         *
         * TODO: Use the appropriate console method.
         */
        console.log(log.data[0]);
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

  toggleChallengeType = () => {
    this.setState(x => {
      const challengeType =
        x.challengeType === "react" ? "typescript" : "react";
      return {
        challengeType,
        tests: getTestCases(challengeType),
      };
    }, this.updateCodeWhenChallengeTypeChanged);
  };

  updateCodeWhenChallengeTypeChanged = () => {
    this.setState(
      x => ({
        code: getStarterCodeForChallenge(x.challengeType),
      }),
      () => {
        this.setMonacoEditorValue();
        this.iFrameRenderPreview();
      },
    );
  };

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
  font-size: 18px;
  font-weight: 500;
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

const Button = styled.button`
  border: none;
  width: 165px;
  margin-right: 12px;
  font-size: 14px;
  font-weight: 500px;
  padding: 6px 12px;
  border-radius: 1px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${C.TEXT_TITLE};
  background: rgb(11, 79, 147);
  background: linear-gradient(
    63deg,
    rgba(11, 79, 147, 1) 15%,
    rgba(17, 182, 237, 0.5) 85%
  );

  :hover {
    cursor: pointer;
    color: ${C.TEXT_HOVER};
    background: rgb(23, 94, 164);
    background: linear-gradient(
      63deg,
      rgba(10, 100, 215, 1) 15%,
      rgba(17, 195, 240, 0.65) 85%
    );
  }

  :focus {
    outline: none;
  }
`;

const SuccessFailureText = styled.p`
  margin: 0;
  margin-left: 4px;
  color: ${(props: { testResult: boolean }) =>
    props.testResult ? C.SUCCESS : C.FAILURE};
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
 * Export
 * ============================================================================
 */

export default Workspace;
