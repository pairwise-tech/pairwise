import React from "react";
import styled from "styled-components";

import "./App.css";

class App extends React.Component {
  iFrame: any;

  componentDidMount() {
    const js = `console.log([1,2,3]);`;
    const doc = `
      <html>
        <head><style></style></head>
        <body>
          <div>
          <h1>Hi yay</h1>
          </div>
          <script>${js}</script>
        </body>
      </html>
    `;

    this.iFrame.srcdoc = doc;
  }

  render() {
    return (
      <Page>
        <Editor />
        <Frame ref={this.setRef} title="code-preview" />
      </Page>
    );
  }

  setRef = (r: any) => {
    this.iFrame = r;
  };
}

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

export default App;
