import { ControlledEditor, EditorDidMount } from "@monaco-editor/react";
import Modules, { ReduxStoreState } from "modules/root";
import React from "react";
import { connect } from "react-redux";
import { debounce } from "throttle-debounce";
import {
  subscribeCodeWorker,
  unsubscribeCodeWorker,
  requestCodeFormatting,
} from "tools/code-worker";
import { COLORS, MONACO_EDITOR_FONT_SIZE_STEP } from "tools/constants";
import { LowerRight, IconButton } from "./Shared";
import { Tooltip, Button, ButtonGroup } from "@blueprintjs/core";
import { CodeFormatMessageEvent } from "tools/test-utils";
import { MonacoEditorThemes } from "@pairwise/common";

const debug = require("debug")("client:ChallengeTestEditor");

const mapStateToProps = (state: ReduxStoreState) => ({
  challengeId: Modules.selectors.challenges.getCurrentChallengeId(state),
  editorOptions: Modules.selectors.user.editorOptions(state),
  userSettings: Modules.selectors.user.userSettings(state),
  challengeTestCode: Modules.selectors.challenges.getCurrentChallengeTestCode(
    state,
  ),
});

const dispatchProps = {
  updateChallenge: Modules.actions.challenges.updateChallenge,
  updateUserSettings: Modules.actions.user.updateUserSettings,
};

const mergeProps = (
  state: ReturnType<typeof mapStateToProps>,
  methods: typeof dispatchProps,
  props: {},
) => ({
  ...props,
  ...methods,
  ...state,
  increaseFontSize: () =>
    methods.updateUserSettings({
      workspaceFontSize:
        state.editorOptions.fontSize + MONACO_EDITOR_FONT_SIZE_STEP,
    }),
  decreaseFontSize: () =>
    methods.updateUserSettings({
      workspaceFontSize:
        state.editorOptions.fontSize - MONACO_EDITOR_FONT_SIZE_STEP,
    }),
});

const CODE_FORMAT_CHANNEL = "TEST_EDITOR";

type Props = ReturnType<typeof mergeProps>;

const ChallengeTestEditor = (props: Props) => {
  const {
    challengeId,
    updateChallenge,
    editorOptions,
    increaseFontSize,
    decreaseFontSize,
  } = props;
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
        theme={MonacoEditorThemes.DEFAULT}
        options={{
          formatOnType: true,
          formatOnPaste: true,
          minimap: {
            enabled: false,
          },
          ...editorOptions,
        }}
      />
      <LowerRight>
        <ButtonGroup vertical style={{ marginBottom: 8 }}>
          <Tooltip content={"Increase Font Size"} position="left">
            <IconButton
              icon="plus"
              aria-label="increase editor font size"
              onClick={increaseFontSize}
            />
          </Tooltip>
          <Tooltip content={"Decrease Font Size"} position="left">
            <IconButton
              icon="minus"
              aria-label="decrease editor font size"
              onClick={decreaseFontSize}
            />
          </Tooltip>
        </ButtonGroup>
        <Tooltip content={"Format Code"} position="left">
          <IconButton
            icon="clean"
            aria-label="format editor code"
            onClick={handleFormatCode}
          />
        </Tooltip>
      </LowerRight>
    </div>
  );
};

export default connect(
  mapStateToProps,
  dispatchProps,
  mergeProps,
)(ChallengeTestEditor);
