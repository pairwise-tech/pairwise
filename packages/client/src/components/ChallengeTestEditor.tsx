import styled from "styled-components/macro";
import ControlledEditor, { registerExternalLib } from "../monaco";
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
import {
  WORKSPACE_LIB_TYPES,
  EXPRESS_JS_LIB_TYPES,
} from "tools/browser-test-lib";
import { OnMount } from "@monaco-editor/react";
import { editor } from "monaco-editor";

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
  const editorRef = React.useRef<editor.IStandaloneCodeEditor>(null);
  const valueGetter = React.useRef<() => string>(() => "");
  const [isReady, setIsReady] = React.useState(false);

  const getEditorValue = () => {
    if (!isReady) {
      console.warn("getEditorValue called before editor was ready");
    }

    // return valueGetter.current();
    if (editorRef.current) {
      return editorRef.current.getValue();
    }

    return "";
  };

  const handleEditorReady: OnMount = (editor, monaco) => {
    // valueGetter.current = getValue;
    setIsReady(true);

    // Format the code when the editor loses focus
    editor.onDidBlurEditorText(handleFormatCode);

    // @ts-ignore
    editorRef.current = editor;
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
      }
    };

    subscribeCodeWorker(handleCodeFormat);

    return () => unsubscribeCodeWorker(handleCodeFormat);
  }, [updateChallenge, challengeId]);

  React.useEffect(() => {
    registerExternalLib({
      name: "pairwise-test-lib.d.ts",
      source: WORKSPACE_LIB_TYPES,
    });
  }, []);

  React.useEffect(() => {
    // Add express library for Backend Module challenges
    if (props.isBackendModuleChallenge) {
      registerExternalLib({
        name: "express-lib.d.ts",
        source: EXPRESS_JS_LIB_TYPES,
      });
    }
  }, [props.isBackendModuleChallenge]);

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
        path="challenge-test-editor.ts"
        language="javascript"
        onMount={handleEditorReady}
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
  font-size: 12px;
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
  isBackendModuleChallenge: Modules.selectors.challenges.isBackendModuleChallenge(
    state,
  ),
  isTestingAndAutomationChallenge: Modules.selectors.challenges.isTestingAndAutomationChallenge(
    state,
  ),
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
