import React from 'react';

import './App.css';

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
      <div className="App">
        <iframe width={500} height={500} ref={this.setRef} title="code-preview" />
      </div>
    );
  }

  setRef = (r: any) => {
    this.iFrame = r;
  }
}

export default App;
