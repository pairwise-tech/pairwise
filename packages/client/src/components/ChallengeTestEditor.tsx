import { ControlledEditor, EditorDidMount } from "@monaco-editor/react";
import Modules, { ReduxStoreState } from "modules/root";
import React from "react";
import { connect } from "react-redux";
import { MONACO_EDITOR_THEME } from "tools/constants";

// TOOD: Should probably replace this with Prettier down the line
const formatCode = (x: string | undefined): string => {
  return x ? JSON.stringify(JSON.parse(x), null, 2) : "";
};

const mapStateToProps = (state: ReduxStoreState) => ({
  challengeId: Modules.selectors.challenges.getCurrentChallengeId(state),
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
  const valueGetter = React.useRef<() => string>(() => "");
  const [isReady, setIsReady] = React.useState(false);
  const getEditorValue = () => {
    if (!isReady) {
      console.warn("getEditorValue called before editor was ready");
    }

    return valueGetter.current();
  };
  const handleEditorReady: EditorDidMount = getValue => {
    valueGetter.current = getValue;
    setIsReady(true);
  };
  const handleUpdate = () => {
    if (!props.challengeId) {
      console.warn("[ERROR] No challenge ID provided");
      return;
    }

    const testCode = getEditorValue();
    try {
      // NOTE: This is just to make sure it is valid before storying it, since
      // you are bound to get invalid JSON during the process of typing some
      // out.
      JSON.parse(testCode);
    } catch (err) {
      console.log(testCode);
      console.log(JSON.stringify(testCode));
      return;
    }

    props.updateChallenge({
      id: props.challengeId,
      challenge: { testCode },
    });
  };

  return (
    <div style={{ color: "white" }} onInput={handleUpdate}>
      <ControlledEditor
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
