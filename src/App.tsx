import React from "react";
import styled from "styled-components";

import * as Babel from "@babel/standalone";

/** ===========================================================================
 * Component
 * ============================================================================
 */

class App extends React.Component {
  iFrame: Nullable<HTMLIFrameElement> = null;

  componentDidMount() {
    const CODE = `
      class App extends React.Component {
        render(): JSX.Element {
          const text: boolean = "Hi yay!!!";
          return (
            <div>
              <h1>{text}</h1>
            </div>
          );
        }
      }
      ReactDOM.render(<App />, document.getElementById('root'));
    `;

    const output = Babel.transform(CODE, {
      presets: [
        "es2015",
        "react",
        ["typescript", { isTSX: true, allExtensions: true }],
      ],
    }).code;

    const HTML_DOCUMENT = `
      <html>
        <head />
        <body>
          <div id="root" />
          <script crossorigin src="https://unpkg.com/react@16/umd/react.development.js"></script>
          <script crossorigin src="https://unpkg.com/react-dom@16/umd/react-dom.development.js"></script>
          <script>${output}</script>
        </body>
      </html>
    `;

    if (this.iFrame) {
      this.iFrame.srcdoc = HTML_DOCUMENT;
    }
  }

  render() {
    return (
      <Page>
        <Editor />
        <Frame ref={this.setRef} title="code-preview" />
      </Page>
    );
  }

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

const Editor = styled.div`
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
