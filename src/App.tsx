import { ControlledEditor } from "@monaco-editor/react";
import { Console, Decode } from "console-feed";
import React from "react";
import { Col, ColsWrapper, Row, RowsWrapper } from "react-grid-resizable";
import styled from "styled-components";

import * as Babel from "@babel/standalone";

/** ===========================================================================
 * Notes:
 *
 * - TODO: Script files should be determined dynamically from the code string
 * import statements, and then fetched from UNPKG and cached. The
 * iframe should only fetch these dependencies once and not on every
 * render like it does not.
 *
 * - TODO: Imports need to be enabled but somehow not cause "module not found"
 * errors. Import statements then need to be dynamically parsed when the
 * code string is executed, and use to define the dependencies which need
 * to be fetched to run the code.
 *
 * - TODO: Monaco editor needs to support JSX syntax...!!!???
 *
 * - TODO: Enable some way to run a suite of tests against the user provided
 * code and render the test results.
 *
 * - TODO: Add a content area to display the content for a given question.
 *
 * - TODO: Console ideally will allow the user to type in it...
 * ============================================================================
 */

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface IState {
  code: string;
  updatedQueued: boolean;
  logs: ReadonlyArray<{ data: ReadonlyArray<any>; method: string }>;
}

const BLUE = "#2ee3ff";
const DARK_HEADER = "rgb(29, 26, 26)";
const DARK_EDITOR = "rgb(35, 35, 35)";
const DARK_CONSOLE = "rgb(36, 36, 36)";
const DARK_DRAGGABLE = "rgb(44, 40, 37)";
const ERROR_BACKGROUND = "#f21f4d";

/** ===========================================================================
 * Component
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
      code: getStarterCode(),
      updatedQueued: false,
    };
  }

  componentDidMount() {
    this.iFrameRender();

    window.addEventListener("message", this.receiveMessage, false);
  }

  componentWillUnmount() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    window.removeEventListener("message", this.receiveMessage);
  }

  handleEditorDidMount = (_: any, editor: any) => {
    this.editorRef = editor;
  };

  render() {
    return (
      <Page>
        <Header>
          <Title>Zen Coding School</Title>
        </Header>
        <WorkspaceContainer>
          <ColsWrapper separatorProps={separatorProps}>
            <Col
              style={{ background: DARK_EDITOR }}
              initialHeight={window.innerHeight - 60}
              initialWidth={window.innerWidth * 0.65}
            >
              <div style={{ height: "100%" }}>
                <ControlledEditor
                  theme="dark"
                  height="100%"
                  language="typescript"
                  value={this.state.code}
                  onChange={this.handleEditorTextChange}
                  editorDidMount={this.handleEditorDidMount}
                />
              </div>
            </Col>
            <Col>
              <RowsWrapper separatorProps={separatorProps}>
                <Row initialHeight={window.innerHeight * 0.6 - 30}>
                  <div>
                    <FrameContainer
                      id="iframe"
                      ref={this.setRef}
                      title="code-preview"
                    />
                  </div>
                </Row>
                <Row
                  style={consoleRowStyles}
                  initialHeight={window.innerHeight * 0.4 - 30}
                >
                  <div>
                    <Console
                      variant="dark"
                      logs={this.state.logs}
                      style={{ PADDING: 0 }}
                    />
                  </div>
                </Row>
              </RowsWrapper>
            </Col>
          </ColsWrapper>
        </WorkspaceContainer>
      </Page>
    );
  }

  handleEditorTextChange = (
    _: any,
    value: string | undefined = this.state.code,
  ) => {
    const { updatedQueued } = this.state;
    this.setState({ code: value, updatedQueued: true }, () => {
      if (!updatedQueued) {
        this.timeout = setTimeout(this.iFrameRender, 2000);
      }
    });
  };

  receiveMessage = (event: any) => {
    try {
      const { source, message } = event.data;
      if (source === "IFRAME_PREVIEW") {
        const data: ReadonlyArray<any> = [JSON.parse(message)];
        const log = Decode([
          {
            data,
            method: "log",
          },
        ]);
        this.setState(({ logs }) => ({
          logs: logs.concat(log),
        }));
      }
    } catch (err) {
      this.setState({ updatedQueued: false }, () =>
        this.recordCompilationError(err),
      );
    }
  };

  iFrameRender = () => {
    this.setState({ logs: DEFAULT_LOGS }, () => {
      if (this.iFrame) {
        try {
          const HTML_DOCUMENT = getHTML(this.transformCode());
          this.iFrame.srcdoc = HTML_DOCUMENT;
          this.setState({ updatedQueued: false }, () =>
            saveCode(this.state.code),
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
    const consoleReplaced = hijackConsoleLog(this.state.code);
    const { code } = stripAndExtractImportDependencies(consoleReplaced);
    const output = Babel.transform(code, {
      presets: [
        "es2015",
        "react",
        ["typescript", { isTSX: true, allExtensions: true }],
      ],
    }).code;
    return output;
  };

  setRef = (ref: HTMLIFrameElement) => {
    this.iFrame = ref;
  };

  recordCompilationError = (error: Error) => {
    const log = Decode([
      {
        data: [error.message],
        method: "error",
      },
    ]);
    this.setState(({ logs }) => ({
      logs: logs.concat(log),
    }));
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
  width: 100vw;
  background: ${DARK_HEADER};
  display: flex;
  align-items: center;
  padding-left: 12px;
  padding-right: 12px;
`;

const Title = styled.p`
  color: ${BLUE};
  margin: 0;
  padding: 0;
  font-weight: 500;
`;

const WorkspaceContainer = styled.div`
  height: 100%;
  width: 100%;
`;

const FrameContainer = styled.iframe`
  flex: 2;
  height: 100%;
  border: none;
`;

const consoleRowStyles = {
  paddingTop: 6,
  paddingBottom: 4,
  background: DARK_CONSOLE,
};

const separatorProps = {
  style: {
    backgroundColor: DARK_DRAGGABLE,
  },
};

/** ===========================================================================
 * Code Utils
 * ============================================================================
 */

const CODE_KEY = "LOCAL_STORAGE_CODE_KEY";

const getStarterCode = () => {
  try {
    const storedCode = localStorage.getItem(CODE_KEY);
    if (storedCode) {
      const code = JSON.parse(storedCode);
      if (code) {
        return code;
      }
    }
  } catch (err) {
    // noop
  }

  return DEFAULT_CODE;
};

const saveCode = (code: string) => {
  localStorage.setItem(CODE_KEY, JSON.stringify(code));
};

const DEFAULT_CODE = `
// import React from "react";
// import ReactDOM from "react-dom";

class App extends React.Component {
  render(): JSX.Element {
    const text: string = "Hello from React!!!";
    console.log("hello from iframe!");
    return (
      <div>
        <h1>{text}</h1>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
`;

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

const DEFAULT_LOGS: ReadonlyArray<any> = [
  {
    method: "warn",
    data: ["console.log output will be rendered here:"],
  },
];

const CONSOLE_INTERCEPTOR = `
const __interceptConsoleMessage = (value) => {
  window.parent.postMessage({
    source: "IFRAME_PREVIEW",
    message: JSON.stringify(value),
  });
}
`;

/**
 * This function is supposed to match all import statements in the code string
 * and remove them, while also identifying the imported libraries and returning
 * those in an array by name, so they can be fetched from a CDN and injected
 * into the code before it is transpiled and run.
 *
 * The code may not work 100%:
 */
const stripAndExtractImportDependencies = (codeString: string) => {
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
const hijackConsoleLog = (codeString: string) => {
  const replaced = codeString.replace(
    /console.log/g,
    "__interceptConsoleMessage",
  );
  return `${CONSOLE_INTERCEPTOR}\n${replaced}`;
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default App;
