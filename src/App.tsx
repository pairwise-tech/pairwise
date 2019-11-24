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
      const text: string = "Hi yay!!!";
      return (
        <div>
          <h1>{text}</h1>
        </div>
      );
    }
  }
  ReactDOM.render(<App />, document.getElementById('root'));
`;

/** ===========================================================================
 * Component
 * ============================================================================
 */

class App extends React.Component<{}, IState> {
  iFrame: Nullable<HTMLIFrameElement> = null;
  editorRef: any = null;
  timeout: any = null; /* Blah, remove later when dependencies are cached */

  constructor(props: {}) {
    super(props);

    this.state = {
      code: DEFAULT_CODE,
      updatedQueued: false,
    };
  }

  handleEditorDidMount = (_: any, editor: any) => {
    this.editorRef = editor;
  };

  componentDidMount() {
    this.iFrameRender();
  }

  componentWillUnmount() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }

  iFrameRender = () => {
    /**
     * TODO: Script files should be determined dynamically from the code string
     * `import` statements, and then fetched from UNPKG and cached. The
     * iframe should only fetch these dependencies once and not on every
     * render like it does not.
     */
    const HTML_DOCUMENT = `
      <html>
        <head>
          <script crossorigin src="https://unpkg.com/react@16/umd/react.development.js"></script>
          <script crossorigin src="https://unpkg.com/react-dom@16/umd/react-dom.development.js"></script>
        </head>
        <body>
          <div id="root" />
          <script id="code">${this.transformCode()}</script>
        </body>
      </html>
    `;

    if (this.iFrame) {
      this.iFrame.srcdoc = HTML_DOCUMENT;
    }

    this.setState({ updatedQueued: false });
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

  handleChange = (e: any, value: string | undefined) => {
    this.onChange(value || this.state.code);
  };

  onChange = async (value: string) => {
    const { updatedQueued } = this.state;
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
