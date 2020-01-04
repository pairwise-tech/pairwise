import IconButton from "@material-ui/core/IconButton";
import FormatLineSpacing from "@material-ui/icons/FormatLineSpacing";
import { ControlledEditor, EditorDidMount } from "@monaco-editor/react";
import Modules, { ReduxStoreState } from "modules/root";
import React from "react";
import { connect } from "react-redux";
import { debounce } from "throttle-debounce";
import {
  CodeFormatMessageEvent,
  requestCodeFormatting,
  subscribeCodeWorker,
  unsubscribeCodeWorker,
} from "tools/challenges";
import { COLORS, MONACO_EDITOR_THEME } from "tools/constants";
import { LowerRight, StyledTooltip } from "./shared";

const debug = require("debug")("client:ChallengeTestEditor");

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

const CODE_FORMAT_CHANNEL = "TEST_EDITOR";

type Props = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

const ChallengeTestEditor = (props: Props) => {
  const { challengeId, updateChallenge } = props;
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
    if (!challengeId) {
      console.warn("[ERROR] No challenge ID provided");
      return;
    }

    const testCode = getEditorValue();
    // try {
    //   // NOTE: This is just to make sure it is valid before storying it, since
    //   // you are bound to get invalid JSON during the process of typing some
    //   // out.
    //   JSON.parse(testCode);
    // } catch (err) {
    //   console.log(testCode);
    //   console.log(JSON.stringify(testCode));
    //   return;
    // }

    // Since we're using a keyup handler this helps to make it function like a change handler.
    const shouldUpdate = testCode !== props.challengeTestCode;

    if (shouldUpdate) {
      updateChallenge({
        id: challengeId,
        challenge: { testCode },
      });
    }
  };
  const updateHandler = React.useRef(debounce(200, handleUpdate));
  const handleFormatCode = () => {
    if (!challengeId) {
      console.warn("[ERROR] No challenge ID provided");
      return;
    }
    requestCodeFormatting({
      code: getEditorValue(),
      type: "typescript",
      channel: CODE_FORMAT_CHANNEL,
    });
  };
  React.useEffect(() => {
    const handleCodeFormat = (e: CodeFormatMessageEvent) => {
      if (!challengeId) {
        console.warn("[ERROR] No challenge ID provided");
        return;
      }

      const { code, channel } = e.data;
      if (code && channel === CODE_FORMAT_CHANNEL) {
        updateChallenge({
          id: challengeId,
          challenge: { testCode: code },
        });
      } else {
        debug("[INFO] Test Editor -- No code passed via message event", e);
      }
    };

    subscribeCodeWorker(handleCodeFormat);

    return () => unsubscribeCodeWorker(handleCodeFormat);
  }, [updateChallenge, challengeId]);

  return (
    <div
      style={{
        height: "calc(100% - 50px)",
        color: "white",
        position: "relative",
        background: COLORS.BACKGROUND_CONSOLE,
      }}
      onKeyUp={updateHandler.current}
    >
      <ControlledEditor
        height="100%"
        language="javascript"
        editorDidMount={handleEditorReady}
        value={props.challengeTestCode}
        theme={MONACO_EDITOR_THEME}
        options={{
          formatOnType: true,
          formatOnPaste: true,
          minimap: {
            enabled: false,
          },
        }}
      />
      <LowerRight>
        <StyledTooltip title={"Format Code"} placement="left">
          <IconButton
            size="medium"
            style={{ color: "white" }}
            aria-label="format editor code"
            onClick={handleFormatCode}
          >
            <FormatLineSpacing fontSize="inherit" />
          </IconButton>
        </StyledTooltip>
      </LowerRight>
    </div>
  );
};

export default connect(mapStateToProps, dispatchProps)(ChallengeTestEditor);
