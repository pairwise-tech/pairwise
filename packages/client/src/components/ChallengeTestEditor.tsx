import styled from "styled-components/macro";
import { EditorDidMount } from "@monaco-editor/react";
import { ControlledEditor, registerExternalLib } from "../monaco";
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
import { Tooltip, ButtonGroup, Popover } from "@blueprintjs/core";
import { CodeFormatMessageEvent, TEST_UTILS_GLOBALS } from "tools/test-utils";
import { MonacoEditorThemes } from "@pairwise/common";
import toaster from "tools/toast-utils";
import { copyToClipboard } from "tools/utils";
import { TEST_EXPECTATION_LIB_TYPES } from "tools/browser-test-lib";

const debug = require("debug")("client:ChallengeTestEditor");

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

const CODE_FORMAT_CHANNEL = "TEST_EDITOR";

/** ===========================================================================
 * React Component
 * ============================================================================
 */

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

  const handleEditorReady: EditorDidMount = (getValue, editor) => {
    valueGetter.current = getValue;
    setIsReady(true);
  };

  const handleUpdate = () => {
    if (!challengeId) {
      console.warn("[ERROR] No challenge ID provided");
      return;
    }

    const testCode = getEditorValue();

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

  React.useEffect(() => {
    registerExternalLib({
      name: "pairwise-test-lib.d.ts",
      source: TEST_EXPECTATION_LIB_TYPES,
    });
  }, []);

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
          <Tooltip content="Increase Font Size" position="left">
            <IconButton
              icon="plus"
              aria-label="increase editor font size"
              onClick={increaseFontSize}
            />
          </Tooltip>
          <Tooltip content="Decrease Font Size" position="left">
            <IconButton
              icon="minus"
              aria-label="decrease editor font size"
              onClick={decreaseFontSize}
            />
          </Tooltip>
        </ButtonGroup>
        <Tooltip content="Format Code" position="left">
          <IconButton
            icon="clean"
            aria-label="format editor code"
            onClick={handleFormatCode}
          />
        </Tooltip>
        <Popover
          canEscapeKeyClose
          content={
            <TestUtilsPopover>
              <TestUtilsTitle>Global Test Utils</TestUtilsTitle>
              {Object.entries(TEST_UTILS_GLOBALS).map(
                ([globalValue, description]) => {
                  return (
                    <UtilBox
                      key={globalValue}
                      onClick={() => {
                        copyToClipboard(globalValue);
                        toaster.success(`"${globalValue}" copied!`);
                      }}
                    >
                      <CopyText>
                        <Code>{globalValue}</Code>
                      </CopyText>
                      <DescriptionText>{description}</DescriptionText>
                    </UtilBox>
                  );
                },
              )}
            </TestUtilsPopover>
          }
        >
          <Tooltip content="View Test Utils" position="left">
            <IconButton icon="more" aria-label="test utils helpers" />
          </Tooltip>
        </Popover>
      </LowerRight>
    </div>
  );
};

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const TestUtilsPopover = styled.div`
  padding: 18px;
  padding-left: 24px;
  padding-right: 24px;
`;

const UtilBox = styled.div`
  margin-top: 8px;

  :hover {
    cursor: pointer;

    code {
      color: ${COLORS.NEON_GREEN};
    }
  }
`;

const CopyText = styled.p`
  margin: 0;
`;

const Code = styled.code``;

const DescriptionText = styled.span`
  font-size: 10px;
  color: ${COLORS.TEXT_CONTENT};
`;

const TestUtilsTitle = styled.h3`
  margin: 0;
  padding-bottom: 4px;
  margin-bottom: 4px;
  border-bottom: 1px solid ${COLORS.TEXT_CONTENT};
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

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

type Props = ReturnType<typeof mergeProps>;

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default connect(
  mapStateToProps,
  dispatchProps,
  mergeProps,
)(ChallengeTestEditor);
