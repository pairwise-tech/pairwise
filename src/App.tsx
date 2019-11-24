import React from "react";
import styled from "styled-components";
import { ControlledEditor } from "@monaco-editor/react";

import * as Babel from "@babel/standalone";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface IState {
  code: string;
  updatedQueued: boolean;
}

/**
 * TODO: Imports need to be enabled but somehow not indicate "module not found"
 * errors. Import statements then need to be dynamically parsed when the
 * code string is executed, and use to define the dependencies which need
 * to be fetched to run the code.
 */
const DEFAULT_CODE = `
  // import React from "react";
  // import ReactDOM from "react-dom";

  class App extends React.Component {
    render(): JSX.Element {
      const text: string = "Hello from React!!!";
      return (
        <div style={{
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          padding: 15,
          position: "fixed",
          background: "rgb(250, 135, 125)",
        }}>
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
      code: DEFAULT_CODE,
      updatedQueued: false,
    };
  }

  componentDidMount() {
    this.iFrameRender();
  }

  componentWillUnmount() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }

  handleEditorDidMount = (_: any, editor: any) => {
    this.editorRef = editor;
  };

  iFrameRender = () => {
    /**
     * TODO: Script files should be determined dynamically from the code string
     * `import` statements, and then fetched from UNPKG and cached. The
     * iframe should only fetch these dependencies once and not on every
     * render like it does not.
     */
    if (this.iFrame) {
      const HTML_DOCUMENT = getHTML(this.transformCode());
      this.iFrame.srcdoc = HTML_DOCUMENT;
      this.setState({ updatedQueued: false });
    }
  };

  transformCode = () => {
    const output = Babel.transform(this.state.code, {
      presets: [
        "es2015",
        "react",
        ["typescript", { isTSX: true, allExtensions: true }],
      ],
    }).code;
    return output;
  };

  /**
   * TODO: Editor must support JSX syntax!!!???
   */
  render() {
    return (
      <Page>
        <EditorContainer>
          <ControlledEditor
            theme="dark"
            height="100vh"
            language="typescript"
            value={this.state.code}
            onChange={this.handleChange}
            editorDidMount={this.handleEditorDidMount}
          />
        </EditorContainer>
        <Frame id="iframe" ref={this.setRef} title="code-preview" />
      </Page>
    );
  }

  handleChange = (_: any, value: string | undefined) => {
    this.onChange(value || this.state.code);
  };

  onChange = async (value: string) => {
    const { updatedQueued } = this.state;

    /**
     * TODO: Remove these after dependencies are cached.
     */
    this.setState({ code: value, updatedQueued: true }, () => {
      if (!updatedQueued) {
        this.timeout = setTimeout(this.iFrameRender, 2000);
      }
    });
  };

  setRef = (r: HTMLIFrameElement) => {
    this.iFrame = r;
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
  display: flex;
  justify-content: space-between;
`;

const EditorContainer = styled.div`
  flex: 2;
  background: rgb(35, 35, 35);
`;

const Frame = styled.iframe`
  flex: 1;
  height: 100%;
  border: none;
`;

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default App;
