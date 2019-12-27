import Editor, { EditorDidMount } from "@monaco-editor/react";
import Modules, { ReduxStoreState } from "modules/root";
import React from "react";
import { connect } from "react-redux";
import { MONACO_EDITOR_THEME } from "tools/constants";

// TOOD: Should probably replace this with Prettier down the line
const formatCode = (x: string | undefined): string => {
  return x ? JSON.stringify(JSON.parse(x), null, 2) : "";
};

const mapStateToProps = (state: ReduxStoreState) => ({
  challengeTestCode: Modules.selectors.challenges.getCurrentChallengeTestCode(
    state,
  ),
});

// (stateProps, dispatchProps, ownProps) => ({
//   ...ownProps,
//   ...dispatchProps,
//   ...stateProps,
//
// });

const dispatchProps = {
  updateChallenge: Modules.actions.challenges.updateChallenge,
};

type Props = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

const ChallengeTestEditor = (props: Props) => {
  const [editorReady, setEditorReady] = React.useState(false);
  const editor = React.useRef();
  const handleEditorReady: EditorDidMount = (_, monaco) => {
    editor.current = monaco;
    setEditorReady(true);
  };

  debugger;

  return (
    <div style={{ color: "white" }}>
      <Editor
        height="50vh"
        language="javascript"
        editorDidMount={handleEditorReady}
        value={formatCode(props.challengeTestCode)}
        theme={MONACO_EDITOR_THEME}
        options={{
          formatOnType: true,
          formatOnPaste: true,
          minimap: {
            enabled: false,
          },
        }}
      />
    </div>
  );
};

export default connect(mapStateToProps, dispatchProps)(ChallengeTestEditor);
