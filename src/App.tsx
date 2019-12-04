import * as Babel from "@babel/standalone";
import { monaco } from "@monaco-editor/react";
import axios from "axios";
import { Console, Decode } from "console-feed";
import { pipe } from "ramda";
import React from "react";
import { Col, ColsWrapper, Row, RowsWrapper } from "react-grid-resizable";
import styled from "styled-components";
import { debounce } from "throttle-debounce";

import { types } from "./types/jsx";

/** ===========================================================================
 * - TODO: Things not done yet for the challenge workspace:
 *
 * HARD:
 * [x] TSX syntax support in monaco editor
 * [ ] TSX syntax highlighting
 * [x] Ability to test React challenges
 * [-] Type definition files: need to find type definition files
 * [-] Fetch import modules dynamically: need to find UNPKG links dynamically
 * [ ] Ability to run NodeJS challenges (e.g. fs, express, etc.)
 * [ ] Ability to run React Native challenges (react-native-web?)
 * [ ] Ability to run terminal/shell challenges?
 * [ ] Secure iframe environment from infinite loops and other unsafe code, e.g.
 *     remove alert, confirm, and other global functions from the user's code.
 *
 * EASIER:
 * [ ] Improve UX for test runner
 * [x] Include console warn and info in console method overrides
 * [ ] cmd+enter should run code but not enter a new line in the editor
 * [ ] Workspace should be generic and just accept a given challenge configuration
 * [ ] Markdown support in challenge content and test results
 * [x] Don't show test console output in workspace console window
 *
 * ============================================================================
 */

/** ===========================================================================
 * Colors
 * ============================================================================
 */

const SUCCESS = "#2ee3ff";
const FAILURE = "#fc426d";
const PRIMARY_BLUE = "#2ee3ff";
const HEADER_BORDER = "#176191";
const TEXT_HOVER = "rgb(245, 245, 245)";
const TEXT_TITLE = "rgb(200, 200, 200)";
const TEXT_CONTENT = "rgb(165, 165, 165)";
const DRAGGABLE_SLIDER = "#161721";
const BACKGROUND_HEADER = "#010203";
const BACKGROUND_CONTENT = "#1e1e21";
const BACKGROUND_EDITOR = "rgb(35, 35, 35)";
const BACKGROUND_CONSOLE = "rgb(36, 36, 36)";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

const W = window.innerWidth;
const H = window.innerHeight;

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

interface Dependency {
  source: string;
  typeDef?: string;
}

type DependencyCache = Map<string, Dependency>;

type CHALLENGE_TYPE = "react" | "typescript";

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
  throttledRenderPreviewFunction: () => void;

  constructor(props: {}) {
    super(props);

    this.throttledRenderPreviewFunction = debounce(
      500,
      this.iFrameRenderPreview,
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
            <Col initialWidth={W * 0.65} initialHeight={H - 60}>
              {!fullScreenEditor ? (
                <RowsWrapper separatorProps={separatorProps}>
                  <Row
                    initialHeight={H * 0.1}
                    style={{ background: BACKGROUND_CONTENT }}
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
                    initialHeight={H * 0.7 - 60}
                    style={{ background: BACKGROUND_EDITOR }}
                  >
                    {MONACO_CONTAINER}
                  </Row>
                  <Row
                    initialHeight={H * 0.2}
                    style={{ background: BACKGROUND_CONTENT }}
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
                <div style={{ height: "100%", background: BACKGROUND_CONSOLE }}>
                  {MONACO_CONTAINER}
                </div>
              )}
            </Col>
            {IS_TYPESCRIPT_CHALLENGE ? (
              <Col style={consoleRowStyles} initialHeight={H - 60}>
                <div>
                  <Console variant="dark" logs={this.state.logs} />
                  <FrameContainer
                    id="iframe"
                    ref={this.setIframeRef}
                    title="code-preview"
                    style={{ visibility: "hidden", height: 0, width: 0 }}
                  />
                </div>
              </Col>
            ) : (
              <Col>
                <RowsWrapper separatorProps={separatorProps}>
                  <Row initialHeight={H * 0.6 - 30}>
                    <div>
                      <FrameContainer
                        id="iframe"
                        ref={this.setIframeRef}
                        title="code-preview"
                      />
                    </div>
                  </Row>
                  <Row style={consoleRowStyles} initialHeight={H * 0.4 - 30}>
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
            <b style={{ color: TEXT_TITLE }}>Test: </b>
            {message}
          </div>
          <div style={{ display: "flex", flexDirection: "row" }}>
            <b style={{ color: TEXT_TITLE }}>Status:</b>
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
            <b style={{ color: TEXT_TITLE }}>Input: </b>
            {JSON.stringify(input)}
          </div>
          <div style={{ display: "flex", flexDirection: "row" }}>
            <b style={{ color: TEXT_TITLE }}>Status:</b>
            <SuccessFailureText testResult={t.testResult}>
              {t.testResult ? "Success!" : "Failure..."}
            </SuccessFailureText>
          </div>
        </ContentText>
      );
    }
  };

  renderEditor = () => {
    return <div id="monaco-editor" style={{ height: "100%" }} />;
  };

  setMonacoValue = () => {
    const models = this.monacoEditor.editor.getModels();
    const model = models[0];
    model.setValue(this.state.code);
  };

  provideModuleTypeDefinitionsToMonaco = (
    packages: ReadonlyArray<string> = [],
  ) => {
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
     * Delay rendering on changes for performance.
     */
    this.setState(ps => ({ code: value }), this.throttledRenderPreviewFunction);
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

          /**
           * Save the current code to local storage.
           */
          saveCodeToLocalStorage(this.state.code, this.state.challengeType);
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

    this.provideModuleTypeDefinitionsToMonaco(dependencies);

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
        this.setMonacoValue();
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
`;

const Header = styled.div`
  height: 60px;
  width: calc(100vw - 48);
  padding-left: 24px;
  padding-right: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid ${HEADER_BORDER};
  background: ${BACKGROUND_HEADER};
  background: linear-gradient(
    63deg,
    rgba(2, 6, 10, 1) 25%,
    rgba(17, 38, 59, 1) 68%,
    rgba(30, 20, 55, 1) 92%
  );
`;

const Title = styled.p`
  color: ${PRIMARY_BLUE};
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
  background: BACKGROUND_CONSOLE,
};

const separatorProps = {
  style: {
    backgroundColor: DRAGGABLE_SLIDER,
  },
};

const ContentContainer = styled.div`
  padding: 8px;
`;

const ContentTitle = styled.h3`
  margin: 0;
  margin-bottom: 12px;
  color: ${TEXT_TITLE};
`;

const ContentText = styled.span`
  margin: 0;
  margin-top: 8px;
  font-size: 15px;
  font-weight: 200px;
  color: ${TEXT_CONTENT};
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
  color: ${TEXT_TITLE};
  background: rgb(11, 79, 147);
  background: linear-gradient(
    63deg,
    rgba(11, 79, 147, 1) 15%,
    rgba(17, 182, 237, 0.5) 85%
  );

  :hover {
    cursor: pointer;
    color: ${TEXT_HOVER};
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
    props.testResult ? SUCCESS : FAILURE};
`;

/** ===========================================================================
 * Code Utils
 * ============================================================================
 */

const CODE_KEY_REACT = "LOCAL_STORAGE_CODE_KEY_REACT";
const CODE_KEY_TS = "LOCAL_STORAGE_CODE_KEY_TYPESCRIPT";

/**
 * Get the initial code for the editor, possibly from localStorage if
 * anything is saved there.
 */
const getStarterCodeForChallenge = (type: "react" | "typescript") => {
  try {
    const KEY = type === "react" ? CODE_KEY_REACT : CODE_KEY_TS;
    const storedCode = localStorage.getItem(KEY);
    if (storedCode) {
      const code = JSON.parse(storedCode);
      if (code) {
        return code;
      }
    }
  } catch (err) {
    // noop
  }

  return type === "react" ? DEFAULT_REACT_CODE : DEFAULT_TYPESCRIPT_CODE;
};

/**
 * Save code to localStorage.
 */
const saveCodeToLocalStorage = (code: string, type: "react" | "typescript") => {
  const KEY = type === "react" ? CODE_KEY_REACT : CODE_KEY_TS;
  localStorage.setItem(KEY, JSON.stringify(code));
};

const DEFAULT_TYPESCRIPT_CODE = `
const addTwoNumbers = (a: number, b: number) => {
  // Edit code here
}

const result = addTwoNumbers(10, 20);
console.log(result);

// Do not edit code below this line
const main = addTwoNumbers;
`;

const DEFAULT_REACT_CODE = `
import React from "react";
import ReactDOM from "react-dom";

class App extends React.Component {
  render(): JSX.Element {
    const welcome: string = "Hello, React!";
    console.log("Hello from the iframe!");
    return (
      <div>
        <h1>{welcome}</h1>
      </div>
    );
  }
}

// Do not edit code below this line
ReactDOM.render(<App />, document.getElementById('root'));`;

/**
 * Get the full html content string for the iframe, injected the user code
 * into it. This currently includes script libraries now.
 */
const getHTML = (js: string) => `
<html>
  <head></head>
  <body style={{ margin: 0, padding: 0 }}>
    <div id="root" />
    <script>${js}</script>
  </body>
</html>
`;

interface TestCaseReact {
  message: string;
  testResult: boolean;
}

interface TestCaseTypeScript {
  input: any;
  expected: any;
  testResult: boolean;
}

type TestCase = TestCaseTypeScript | TestCaseReact;

const addDefaultTestResults = (x: any) => ({ ...x, testResult: false });

/**
 * Sample test cases for the one hard coded test.
 */
const TEST_CASES: ReadonlyArray<TestCaseTypeScript> = [
  { input: [1, 2], expected: 3 },
  { input: [10, 50], expected: 60 },
  { input: [-10, -50], expected: -60 },
  { input: [100, 500], expected: 600 },
  { input: [1123, 532142], expected: 533265 },
  { input: [-10, 50], expected: 40 },
  { input: [1, 500], expected: 501 },
  { input: [842, 124], expected: 966 },
  { input: [1000, 500], expected: 1500 },
  { input: [-100, 100], expected: 0 },
  { input: [2, 50234432], expected: 50234434 },
].map(addDefaultTestResults);

const TEST_CASES_REACT: ReadonlyArray<TestCaseReact> = [
  {
    message: `Renders a <h1> tag with the text "Hello, React!"`,
  },
  {
    message: `Renders a controlled <input /> using React state`,
  },
].map(addDefaultTestResults);

const getTestCases = (challengeType: "react" | "typescript") => {
  if (challengeType === "react") {
    return TEST_CASES_REACT;
  } else {
    return TEST_CASES;
  }
};

/**
 * Inject test code into a code string.
 */
const injectTestCode = (challengeType: "react" | "typescript") => (
  codeString: string,
) => {
  if (challengeType === "react") {
    return `
      ${codeString}
      {
        ${removeConsole(codeString)}
        ${getSampleTestCodeReact()}
      }
    `;
  } else {
    return `
      ${codeString}
      {
        ${removeConsole(codeString)}
        ${getSampleTestCode(TEST_CASES)}
      }
    `;
  }
};

/**
 * Get all imported dependencies from the DependencyCacheService.
 */
const getRequiredDependencies = async (dependencies: ReadonlyArray<string>) => {
  return Promise.all(
    dependencies.map(d => DependencyCacheService.getDependency(d)),
  );
};

/**
 * Concatenate package source dependencies to code string.
 */
const addDependencies = (
  codeString: string,
  dependencies: ReadonlyArray<string>,
) => {
  let result = "";

  for (const dependency of dependencies) {
    result += `${dependency}\n`;
  }

  result += codeString;
  return result;
};

/**
 * Some sample code to run provided tests against a challenge and post
 * the messages back to the app to render.
 */
const getSampleTestCode = (testCases: ReadonlyArray<TestCaseTypeScript>) => `
let results = [];

for (const x of ${JSON.stringify(testCases)}) {
  const { input, expected } = x;
  results.push(main(...input) === expected);
}

window.parent.postMessage({
  message: JSON.stringify(results),
  source: "TEST_RESULTS",
});
`;

/**
 * Some sample code to run provided tests against a challenge and post
 * the messages back to the app to render.
 */
const getSampleTestCodeReact = () => `
{
  let results = [];

  function fn1() {
    const container = document.createElement("div");
    ReactTestUtils.act(() => {
      ReactDOM.render(<Main />, container);
    });
    const label = container.querySelector("h1");
    return label.textContent === "Hello, React!";
  }

  function fn2() {
    const container = document.createElement("div");
    ReactTestUtils.act(() => {
      ReactDOM.render(<Main />, container);
    });
    const inputEl = container.querySelector("input");
    const testValue = "giraffe";
    ReactTestUtils.Simulate.change(inputEl, { target: { value: testValue } });
    return inputEl.value === testValue;
  }

  results.push(fn1());
  results.push(fn2());

  window.parent.postMessage({
    message: JSON.stringify(results),
    source: "TEST_RESULTS",
  });
}
`;

/**
 * Functions used to intercept console methods and post the messages to
 * the parent window.
 */
const CONSOLE_INTERCEPTORS = `
const __interceptConsoleLog = (value) => {
  window.parent.postMessage({
    message: JSON.stringify(value),
    source: "LOG",
  });
}

const __interceptConsoleInfo = (value) => {
  window.parent.postMessage({
    message: JSON.stringify(value),
    source: "INFO",
  });
}

const __interceptConsoleWarn = (value) => {
  window.parent.postMessage({
    message: JSON.stringify(value),
    source: "WARN",
  });
}

const __interceptConsoleError = (value) => {
  window.parent.postMessage({
    message: JSON.stringify(value),
    source: "ERROR",
  });
}
`;

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

/**
 * This function is supposed to match all import statements in the code string
 * and remove them, while also identifying the imported libraries and returning
 * those in an array by name, so they can be fetched from a CDN and injected
 * into the code before it is transpiled and run.
 *
 * The code may not work 100%:
 */
const stripAndExtractImportDependencies = (codeString: string) => {
  // Reference: https://gist.github.com/manekinekko/7e58a17bc62a9be47172
  const regex = new RegExp(
    /import(?:["'\s]*([\w*{}\n\r\t, ]+)from\s*)?["'\s].*([@\w/_-]+)["'\s].*/g,
  );
  const result = codeString.match(regex);

  let strippedImports = codeString;
  let dependencies: ReadonlyArray<string> = [];

  if (result) {
    for (const importStatement of result) {
      const libs = importStatement.match(/"(.*?)"/);
      if (libs) {
        dependencies = dependencies.concat(libs[1]);
      }

      strippedImports = strippedImports.replace(importStatement, "");
    }
  }

  return {
    dependencies,
    code: strippedImports,
  };
};

/**
 * Replace all console.log statements with a call to a custom function which
 * is injected on the top of the code string before it is run. The custom
 * function will post a message outside of the iframe to the parent window
 * object, which is listening to capture these messages and serve them to the
 * workspace console.
 */
const hijackConsole = (codeString: string) => {
  const replacedConsole = codeString
    .replace(/console.log/g, "__interceptConsoleLog")
    .replace(/console.info/g, "__interceptConsoleInfo")
    .replace(/console.warn/g, "__interceptConsoleWarn")
    .replace(/console.error/g, "__interceptConsoleError");

  return `${CONSOLE_INTERCEPTORS}${replacedConsole}`;
};

const removeConsole = (codeString: string) => {
  return codeString
    .replace(/console.log/g, "// ")
    .replace(/console.info/g, "// ")
    .replace(/console.warn/g, "// ")
    .replace(/console.error/g, "// ");
};

/**
 * Transpile the code use Babel standalone module.
 */
const transpileCodeWithBabel = (codeString: string) => {
  return Babel.transform(codeString, {
    presets: [
      "es2017",
      "react",
      ["typescript", { isTSX: true, allExtensions: true }],
    ],
  }).code;
};

/**
 * Fetch the required module dependencies and inject them into the code string.
 */
const handleInjectModuleDependencies = (
  dependencies: ReadonlyArray<string>,
) => async (codeString: string) => {
  /**
   * TODO: The following method could throw an error if an imported package
   * cannot be found, this condition should be handled.
   */
  const dependencySourceList = await getRequiredDependencies(dependencies);
  const codeWithDependencies = addDependencies(
    codeString,
    dependencySourceList,
  );

  return codeWithDependencies;
};

/**
 * Assert a condition cannot occur. Used for writing exhaustive switch
 * blocks (e.g. see unwrapOkValueIfExists).
 */
export const assertUnreachable = (x: never): never => {
  throw new Error(
    `Panic! Received a value which should not exist: ${JSON.stringify(x)}`,
  );
};

/**
 * Artificially wait the provided amount of time.
 */
export const wait = async (time: number = 1000) => {
  await new Promise((_: any) => setTimeout(_, time));
};

/** ===========================================================================
 * Module Caching Service
 * ============================================================================
 */

/**
 * TODO: Find a way to derive this file URLs dynamically from the package
 * name... I'm not sure how to do this as they can be arbitrarily placed
 * within a package and there is no canonical way to find the source file.
 *
 * However, we could just hard code these now for any libraries used within
 * the curriculum. It doesn't make very much sense for people to import other
 * libraries within the workspace itself, and anyway some error/warning could
 * be provided if they tried to do that.
 */
const CDN_PACKAGE_LINKS = {
  react: "https://unpkg.com/react@16/umd/react.development.js",
  "react-dom": "https://unpkg.com/react-dom@16/umd/react-dom.development.js",
  "react-dom-test-utils":
    "https://unpkg.com/react-dom@16.12.0/umd/react-dom-test-utils.development.js",
};

class DependencyCacheClass {
  dependencies: DependencyCache = new Map();
  cdnLinks = new Map(Object.entries(CDN_PACKAGE_LINKS));

  getDependency = async (packageName: string) => {
    if (this.dependencies.has(packageName)) {
      /**
       * The package is cached just return the code.
       */
      const dependency = this.dependencies.get(packageName) as Dependency;
      return dependency.source;
    } else {
      if (this.cdnLinks.has(packageName)) {
        try {
          /**
           * TODO: Find a way to fetch the type definitions as well. Or,
           * hard code them in the CDN_PACKAGE_LINKS constant and just use
           * the values there.
           */
          const uri = this.cdnLinks.get(packageName) as string;
          const response = await axios.get(uri, {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          });
          const source = response.data;
          this.dependencies.set(packageName, { source });
          return source;
        } catch (err) {
          throw new Error(
            `Could not find dependency source for package ${packageName}`,
          );
        }
      }
    }
  };
}

const DependencyCacheService = new DependencyCacheClass();

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default Workspace;
