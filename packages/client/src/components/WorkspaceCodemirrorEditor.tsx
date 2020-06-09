import React from "react";
import { Controlled as CodeMirror } from "react-codemirror2";
import {
  ICodeEditorProps,
  ICodeEditor,
  ICodeEditorOptions,
  PAIRWISE_CODE_EDITOR_ID,
} from "./Workspace";
import { wait } from "tools/utils";
import styled from "styled-components/macro";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/material-darker.css";
import "codemirror/mode/xml/xml.js";
import "codemirror/mode/javascript/javascript.js";
import "codemirror/mode/htmlmixed/htmlmixed.js";
import "codemirror/addon/edit/matchbrackets.js";
import "codemirror/addon/edit/matchtags.js";
import "codemirror/addon/edit/closebrackets.js";
import "codemirror/addon/edit/closetag.js";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const debug = require("debug")("client:WorkspaceCodemirrorEditor");

interface IState {
  theWaitIsOver: boolean;
  fontSize: number;
}

export default class WorkspaceCodemirrorEditor
  extends React.Component<ICodeEditorProps, IState>
  implements ICodeEditor {
  // The TS lib doesn't type their editor... p(●｀□´●)q
  // So I'm just going to make up a type
  codemirrorInstance: Nullable<{ focus(): void }> = null;

  state = {
    theWaitIsOver: false,
    fontSize: this.props.editorOptions.fontSize || 16,
  };

  private _isMounted: boolean = true;

  updateOptions = (options: Partial<ICodeEditorOptions>) => {
    debug("updateOptions", options);
    const { fontSize } = options;
    if (fontSize) {
      this.setState({ fontSize });
    }
  };

  refresh = async () => {
    debug("noop(refresh)");
    // Unecessary for the controlled component, but required by the ICodeEditor spec
    // noop
  };

  focus = () => {
    if (typeof this.codemirrorInstance?.focus === "function") {
      this.codemirrorInstance.focus();
    }
  };

  setTheme = (theme: string) => {
    debug("noop(setTheme)");
    // We don't support this for codemirror since it's only a stopgap while the
    // user is on mobile, but it's required by the ICodeEditor spec
    // noop
  };

  cleanup = () => {
    debug("cleanup");
    this.codemirrorInstance = null;
    this._isMounted = false;
  };

  componentWillUnmount() {
    this.cleanup();
  }

  async componentDidMount() {
    // Codemirror needs to wait for the UI to be "set up" in order to do it's
    // dom measurements. It will silently just look terrible if we don't give it
    // a bit of time
    await wait(500);

    if (this._isMounted) {
      this.setState({ theWaitIsOver: true });
    }
  }

  render() {
    const { language } = this.props;

    // NOTE: We need htmlmixed if we want CSS to get highlighted in HTML code
    const mode =
      language === "html" ? "htmlmixed" : `text/${this.props.language}`;

    const options = {
      mode,
      theme: "material-darker",
      lineNumbers: true,
      matchBrackets: true,
      matchTags: true,
      autoCloseBrackets: true,
      autoCloseTags: true,
    };
    const { theWaitIsOver, fontSize } = this.state;

    return (
      <CodemirrorContainer id={PAIRWISE_CODE_EDITOR_ID} style={{ fontSize }}>
        {theWaitIsOver && (
          <CodeMirror
            editorDidMount={editor => {
              this.codemirrorInstance = editor;
            }}
            value={this.props.value}
            options={options}
            onBeforeChange={(editor, data, value) => {
              this.props.onChange(value);
            }}
          />
        )}
      </CodemirrorContainer>
    );
  }
}

const CodemirrorContainer = styled.div`
  height: 100%;

  .react-codemirror2 {
    height: 100%;

    .CodeMirror {
      height: 100%;
    }
  }
`;
