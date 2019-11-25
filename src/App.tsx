import * as Babel from "@babel/standalone";
import { ControlledEditor } from "@monaco-editor/react";
import { Console, Decode } from "console-feed";
import React from "react";
import { Col, ColsWrapper, Row, RowsWrapper } from "react-grid-resizable";
import styled from "styled-components";

/** ===========================================================================
 * - TODO: Things not done yet:
 *
 * - Script files should be determined dynamically from the code string
 * import statements, and then fetched from UNPKG and cached. The
 * iframe should only fetch these dependencies once and not on every
 * render like it does not.
 *
 * - Ability to run NodeJS code, e.g. challenges which teach NodeJS APIs or
 * even run a simple Express server.
 *
 * - Possibly a terminal/bash experience to teach bash challenges. I'm not
 * sure to what extent this is possible in a pure browser environment. It's
 * possible we could create some emulated fake environment to just teach
 * very basic commands. Or just totally disregard this.
 *
 * - Imports need to be enabled but somehow not cause "module not found"
 * errors. Import statements then need to be dynamically parsed when the
 * code string is executed, and use to define the dependencies which need
 * to be fetched to run the code.
 *
 * - Monaco editor needs to support JSX syntax...!!!???
 *
 * - Improve test runner UX.
 *
 * - Test runner for React challenges.
 *
 * - Code execution and test environment for React Native.
 *
 * - Console ideally will allow the user to type in it... Or logs can also
 * be forwarded to the browser console to allow full use of devtools there.
 *
 * - Expand console overrides to include warn and info methods as well.
 *
 * - Ideally cmd+enter to run code should not enter a new line in the
 * code editor.
 * ============================================================================
 */

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface IState {
  code: string;
  reactJS: boolean;
  updatedQueued: boolean;
  fullScreenEditor: boolean;
  displayTextResults: boolean;
  tests: ReadonlyArray<TestCase>;
  logs: ReadonlyArray<{ data: ReadonlyArray<any>; method: string }>;
}

const PRIMARY_BLUE = "#2ee3ff";
const TEXT_HOVER = "rgb(245, 245, 245)";
const TEXT_TITLE = "rgb(200, 200, 200)";
const TEXT_CONTENT = "rgb(155, 155, 155)";
const BACKGROUND_HEADER = "#010203";
const BACKGROUND_EDITOR = "rgb(35, 35, 35)";
const BACKGROUND_CONSOLE = "rgb(36, 36, 36)";
const BACKGROUND_CONTENT = "#1e1e21";
const DRAGGABLE_SLIDER = "#161721";
const HEADER_BORDER = "#176191";
const SUCCESS = "#55f73e";
const FAILURE = "#fc426d";

const W = window.innerWidth;
const H = window.innerHeight;

/** ===========================================================================
 * React Component
 * ============================================================================
 */

class App extends React.Component<{}, IState> {
  timeout: any = null;
  editorRef: any = null;
  iFrame: Nullable<HTMLIFrameElement> = null;

  constructor(props: {}) {
    super(props);

    this.state = {
      logs: DEFAULT_LOGS,
      updatedQueued: false,
      reactJS: false,
      tests: TEST_CASES,
      displayTextResults: false,
      fullScreenEditor: false,
      code: getStarterCode("typescript"),
    };
  }

  componentDidMount() {
    this.iFrameRenderPreview();

    document.addEventListener("keydown", this.handleKeyPress);

    window.addEventListener(
      "message",
      this.handleReceiveMessageFromPreview,
      false,
    );
  }

  componentWillUnmount() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    window.removeEventListener("keydown", this.handleKeyPress);
    window.removeEventListener("message", this.handleReceiveMessageFromPreview);
  }

  render() {
    const { tests, reactJS, displayTextResults, fullScreenEditor } = this.state;
    const IS_TYPESCRIPT_CHALLENGE = !reactJS;

    return (
      <Page>
        <Header>
          <Title>Zen Coding School</Title>
          <ControlsContainer>
            <Button onClick={this.toggleEditor}>
              {fullScreenEditor ? "Regular" : "Full Screen"} Editor
            </Button>
            <Button onClick={this.executeTests}>Run Tests</Button>
            <Button onClick={this.toggleChallengeType}>
              {reactJS ? "TypeScript" : "React"} Challenge
            </Button>
          </ControlsContainer>
        </Header>
        <WorkspaceContainer>
          <ColsWrapper separatorProps={separatorProps}>
            <Col initialWidth={W * 0.65} initialHeight={H - 60}>
              {!fullScreenEditor ? (
                <RowsWrapper separatorProps={separatorProps}>
                  <Row
                    style={{ background: BACKGROUND_CONTENT }}
                    initialHeight={H * 0.32}
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
                    style={{ background: BACKGROUND_EDITOR }}
                    initialHeight={H * 0.6 - 60}
                  >
                    <div style={{ height: "100%" }}>{this.renderEditor()}</div>
                  </Row>
                  <Row
                    style={{ background: BACKGROUND_CONTENT }}
                    initialHeight={H * 0.08}
                  >
                    <ContentContainer>
                      <ContentTitle style={{ marginBottom: 12 }}>
                        Tests
                      </ContentTitle>
                      {displayTextResults && (
                        <React.Fragment>
                          {tests.map(this.renderTestResult)}
                        </React.Fragment>
                      )}
                    </ContentContainer>
                  </Row>
                </RowsWrapper>
              ) : (
                <div style={{ height: "100%", background: BACKGROUND_CONSOLE }}>
                  {this.renderEditor()}
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

  renderEditor = () => {
    return (
      <ControlledEditor
        theme="dark"
        height="100%"
        language="typescript"
        value={this.state.code}
        onChange={this.handleEditorTextChange}
        editorDidMount={this.handleEditorDidMount}
      />
    );
  };

  renderTestResult = (t: TestCase, i: number) => (
    <ContentText key={i} style={{ display: "flex", flexDirection: "row" }}>
      <div style={{ width: 175 }}>
        <b style={{ color: TEXT_TITLE }}>Input: </b>
        {JSON.stringify(t.input)}{" "}
      </div>
      <div style={{ display: "flex", flexDirection: "row" }}>
        <b style={{ color: TEXT_TITLE }}>Result:</b>
        <p
          style={{
            margin: 0,
            marginLeft: 4,
            color: t.testResult ? SUCCESS : FAILURE,
          }}
        >
          {t.testResult === true ? "Success" : "Failure"}
        </p>
      </div>
    </ContentText>
  );

  handleEditorTextChange = (
    _: any,
    value: string | undefined = this.state.code,
  ) => {
    const { updatedQueued } = this.state;
    /**
     * Every time the preview is rendered it fetches libraries from CDNs, so
     * just delay it with a timer right now until these dependencies can be
     * cached in a better way.
     */
    this.setState({ code: value, updatedQueued: true }, () => {
      if (!updatedQueued) {
        this.timeout = setTimeout(this.iFrameRenderPreview, 2000);
      }
    });
  };

  handleReceiveMessageFromPreview = (event: MessageEvent) => {
    try {
      const { source, message } = event.data;
      if (source === "IFRAME_PREVIEW_LOG") {
        const msg = JSON.parse(message);
        const data: ReadonlyArray<any> = [msg];
        const log = Decode([
          {
            data,
            method: "log",
          },
        ]);
        this.updateWorkspaceConsole(log);
      } else if (source === "IFRAME_PREVIEW_ERROR") {
        const msg = JSON.parse(message);
        const data: ReadonlyArray<any> = [msg];
        const log = Decode([
          {
            data,
            method: "error",
          },
        ]);
        this.updateWorkspaceConsole(log);
      } else if (source === "TEST_RESULTS") {
        const results = JSON.parse(message);
        const testCasesCopy = this.state.tests.slice();
        for (let i = 0; i < results.length; i++) {
          testCasesCopy[i].testResult = results[i];
        }
        this.setState({ tests: testCasesCopy });
      }
    } catch (err) {
      this.setState({ updatedQueued: false });
    }
  };

  iFrameRenderPreview = () => {
    console.clear();
    this.setState({ logs: DEFAULT_LOGS }, () => {
      if (this.iFrame) {
        try {
          /**
           * Compile the user's code with Babel, including dependencies, and
           * then render the entire thing in the iframe preview.
           */
          const HTML_DOCUMENT = getHTML(this.transformCode());
          this.iFrame.srcdoc = HTML_DOCUMENT;
          this.setState({ updatedQueued: false }, () =>
            saveCodeToLocalStorage(
              this.state.code,
              this.state.reactJS ? "react" : "typescript",
            ),
          );
        } catch (err) {
          this.setState({ updatedQueued: false }, () =>
            this.recordCompilationError(err),
          );
        }
      }
    });
  };

  transformCode = () => {
    /**
     * Replace all the console.log statements to capture their output and
     * remove all import statements (so the code will compile) and also to
     * capture the libraries to then fetch them dynamically from UNPKG.
     */
    const { code } = stripAndExtractImportDependencies(this.state.code);
    const codeWithTests = injectTestCode(code);
    const consoleReplaced = hijackConsole(codeWithTests);
    const output = Babel.transform(consoleReplaced, {
      presets: [
        "es2015",
        "react",
        ["typescript", { isTSX: true, allExtensions: true }],
      ],
    }).code;
    return output;
  };

  recordCompilationError = (error: Error) => {
    const log = Decode([
      {
        data: [error.message],
        method: "error",
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
         * TODO: Render error messages as well.
         */
        console.log(log.data[0]);
      },
    );
  };

  handleEditorDidMount = (_: any, editor: any) => {
    this.editorRef = editor;
  };

  handleKeyPress = (event: KeyboardEvent) => {
    if (event.key === "Meta" && event.keyCode === 91) {
      this.executeTests();
    }
  };

  executeTests = () => {
    this.setState({ displayTextResults: true });
  };

  toggleEditor = () => {
    this.setState(x => ({ fullScreenEditor: !x.fullScreenEditor }));
  };

  toggleChallengeType = () => {
    this.setState(x => ({ reactJS: !x.reactJS }), this.updateCode);
  };

  updateCode = () => {
    this.setState(
      x => ({
        code: getStarterCode(x.reactJS ? "react" : "typescript"),
      }),
      this.iFrameRenderPreview,
    );
  };

  setIframeRef = (ref: HTMLIFrameElement) => {
    this.iFrame = ref;
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
  color: ${TEXT_TITLE};
`;

const ContentText = styled.p`
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

/** ===========================================================================
 * Code Utils
 * ============================================================================
 */

const CODE_KEY_REACT = "LOCAL_STORAGE_CODE_KEY_REACT";
const CODE_KEY_TS = "LOCAL_STORAGE_CODE_KEY_TYPESCRIPT";

const getStarterCode = (type: "react" | "typescript") => {
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

const getHTML = (js: string) => `
<html>
  <head>
    <script crossorigin src="https://unpkg.com/react@16/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@16/umd/react-dom.development.js"></script>
  </head>
  <body style={{ margin: 0, padding: 0 }}>
    <div id="root" />
    <script>${js}</script>
  </body>
</html>
`;

interface TestCase {
  input: any;
  expected: any;
  testResult?: boolean;
}

const TEST_CASES: ReadonlyArray<TestCase> = [
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
];

const injectTestCode = (codeString: string) => {
  return `
    ${codeString}
    ${getSampleTestCode(TEST_CASES)}
  `;
};

const getSampleTestCode = (testCases?: ReadonlyArray<TestCase>) => `
let results = [];

for (const x of ${JSON.stringify(testCases)}) {
  const { input, expected } = x;
  results.push(main(...input) === expected);
}

window.parent.postMessage({
  source: "TEST_RESULTS",
  message: JSON.stringify(results),
});
`;

const CONSOLE_INTERCEPTORS = `
const __interceptConsoleLog = (value) => {
  window.parent.postMessage({
    source: "IFRAME_PREVIEW_LOG",
    message: JSON.stringify(value),
  });
}

const __interceptConsoleError = (value) => {
  window.parent.postMessage({
    source: "IFRAME_PREVIEW_ERROR",
    message: JSON.stringify(value),
  });
}
`;

interface Log {
  data: ReadonlyArray<string>;
  method: "warn" | "info" | "error" | "log";
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
        dependencies = dependencies.concat(libs[0]);
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
  const tryCatchCodeString = `
  try {
    ${codeString}
  } catch (err) {
    console.error(err.message);
  }
  `;

  const replacedLog = tryCatchCodeString.replace(
    /console.log/g,
    "__interceptConsoleLog",
  );

  const replacedError = replacedLog.replace(
    /console.error/g,
    "__interceptConsoleError",
  );

  return `${CONSOLE_INTERCEPTORS}${replacedError}`;
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default App;
