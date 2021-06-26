import React from "react";
import { Controlled as CodeMirror } from "react-codemirror2";
import { ICodeEditorProps, ICodeEditor, ICodeEditorOptions } from "./Workspace";
import { wait } from "tools/utils";
import styled from "styled-components/macro";

// Import codemirror theme files
import "codemirror/lib/codemirror.css";
import "codemirror/theme/material-darker.css";
import "codemirror/mode/xml/xml.js";
import "codemirror/mode/javascript/javascript.js";
import "codemirror/mode/python/python.js";
import "codemirror/mode/rust/rust.js";
import "codemirror/mode/go/go.js";
import "codemirror/mode/htmlmixed/htmlmixed.js";
import "codemirror/addon/edit/matchbrackets.js";
import "codemirror/addon/edit/matchtags.js";
import "codemirror/addon/edit/closebrackets.js";
import "codemirror/addon/edit/closetag.js";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface IState {
  theWaitIsOver: boolean;
}

interface MockedCodeMirrorEditor {
  focus(): void;
}

/** ===========================================================================
 * WorkspaceCodemirrorEditor
 * ============================================================================
 */

class WorkspaceCodemirrorEditor
  extends React.Component<ICodeEditorProps, IState>
  implements ICodeEditor
{
  // The TS lib doesn't type their editor... p(●｀□´●)q
  // So I'm just going to make up a type
  codemirrorInstance: Nullable<MockedCodeMirrorEditor> = null;

  state = {
    theWaitIsOver: false,
  };

  private _isMounted = false;

  editorDidMount = (editor: MockedCodeMirrorEditor) => {
    this.codemirrorInstance = editor;
    editor.focus();
  };

  cleanup = () => {
    this.codemirrorInstance = null;
    this._isMounted = false;
  };

  componentWillUnmount() {
    this.cleanup();
  }

  async componentDidMount() {
    this._isMounted = true;

    // Codemirror needs to wait for the UI to be "set up" in order to do it's
    // dom measurements. It will silently just look terrible if we don't give it
    // a bit of time
    await wait(500);

    // Silly un-cancellable promises...
    if (this._isMounted) {
      this.setState({ theWaitIsOver: true });
    }
  }

  render() {
    const { language, editorOptions } = this.props;
    const { theWaitIsOver } = this.state;
    const { fontSize } = editorOptions;

    let mode = language;
    if (language === "html") {
      mode = "htmlmixed";
    } else if (language === "typescript") {
      mode = "text/typescript";
    }

    const options = {
      mode,
      theme: "material-darker",
      matchTags: true,
      lineNumbers: true,
      lineWrapping: true,
      autoCloseTags: true,
      matchBrackets: true,
      autoCloseBrackets: true,
    };

    return (
      <CodemirrorContainer style={{ fontSize }}>
        {theWaitIsOver && (
          <CodeMirror
            options={options}
            value={this.props.value}
            editorDidMount={this.editorDidMount}
            onBeforeChange={(editor, data, value) => {
              this.props.onChange(value);
            }}
          />
        )}
      </CodemirrorContainer>
    );
  }
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const CodemirrorContainer = styled.div`
  height: 100%;

  // Custom comment styles. They were a very low-contrast gray before.
  // The color used here is the same as monaco, so should be consistent
  .cm-s-material-darker .cm-comment {
    color: #608b4e;
  }

  .react-codemirror2 {
    height: 100%;

    .CodeMirror {
      height: 100%;
    }
  }
`;

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default WorkspaceCodemirrorEditor;
