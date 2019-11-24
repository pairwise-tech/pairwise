import React from "react";
import { Col, ColsWrapper, Row, RowsWrapper } from "react-grid-resizable";
import styled from "styled-components";
import { Console, Decode } from "console-feed";
import { ControlledEditor } from "@monaco-editor/react";

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

const ORANGE = "rgb(253, 72, 45)";
const DARK_MILD = "rgb(44, 40, 37)";
const DARK_HEADER = "rgb(29, 26, 26)";
const DARK_CONSOLE = "rgb(36, 36, 36)";
const DARK_EDITOR = "rgb(35, 35, 35)";

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
      code: DEFAULT_CODE,
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
        const data = [JSON.parse(message)];
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
      this.setState({ updatedQueued: false });
    }
  };

  iFrameRender = () => {
    this.setState({ logs: DEFAULT_LOGS }, () => {
      if (this.iFrame) {
        try {
          const HTML_DOCUMENT = getHTML(this.transformCode());
          this.iFrame.srcdoc = HTML_DOCUMENT;
          this.setState({ updatedQueued: false });
        } catch (err) {
          this.setState({ updatedQueued: false });
        }
      }
    });
  };

  transformCode = () => {
    const consoleReplaced = hijackConsoleLog(this.state.code);
    const output = Babel.transform(consoleReplaced, {
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
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: ${DARK_HEADER};
  display: flex;
  align-items: center;
  padding-left: 12px;
  padding-right: 12px;
`;

const Title = styled.p`
  color: ${ORANGE};
  margin: 0;
  padding: 0;
  font-weight: bold;
`;

const WorkspaceContainer = styled.div`
  padding-top: 60px;
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
    backgroundColor: DARK_MILD,
  },
};

/** ===========================================================================
 * Code Utils
 * ============================================================================
 */

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

const DEFAULT_LOGS = [
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
