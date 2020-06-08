import React from "react";
import {
  ICodeEditorProps,
  ICodeEditor,
  ICodeEditorOptions,
  PAIRWISE_CODE_EDITOR_ID,
  p,
} from "./Workspace";
import cx from "classnames";

const debug = require("debug")("client:WorkspaceCodemirrorEditor");

const sup = true;

interface IState {}

export default class WorkspaceCodemirrorEditor
  extends React.Component<ICodeEditorProps, IState>
  implements ICodeEditor {
  updateOptions = () => {
    // TODO...
  };

  refresh = async () => {
    // TODO...
  };

  focus = () => {
    // TODO...
  };

  setTheme = (theme: string) => {
    // TODO...
  };

  cleanup = () => {
    // TODO...
  };

  render() {
    return <div id={PAIRWISE_CODE_EDITOR_ID} style={{ height: "100%" }} />;
  }
}
