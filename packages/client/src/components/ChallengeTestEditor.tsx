import styled from "styled-components/macro";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import Editor from "@monaco-editor/react";
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
import { OnMount } from "@monaco-editor/react";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

const CODE_FORMAT_CHANNEL = "CODEPRESS_TEST_EDITOR";

export const CHALLENGE_TEST_EDITOR = "challenge-test-editor.ts";

interface IState {
  mounted: boolean;
}

/** ===========================================================================
 * React Component
 * ============================================================================
 */
class ChallengeTestEditor extends React.Component<IProps, IState> {
  debouncedHandleUpdate: () => void;
  editor: Nullable<monaco.editor.IStandaloneCodeEditor> = null;

  constructor(props: IProps) {
    super(props);

    this.state = {
      mounted: false,
    };

    this.debouncedHandleUpdate = debounce(200, this.handleEditorValueUpdate);
  }

  componentDidMount() {
    subscribeCodeWorker(this.handleCodeFormat);
  }

  componentWillUnmount() {
    unsubscribeCodeWorker(this.handleCodeFormat);
  }

  editorOnMount: OnMount = (editor, monaco) => {
    // Format the code when the editor loses focus
    editor.onDidBlurEditorText(this.requestCodeFormatting);

    this.editor = editor;

    this.setState({ mounted: true });
  };

  render(): JSX.Element {
    const {
      editorOptions,
      increaseFontSize,
      decreaseFontSize,
      challengeTestCode,
    } = this.props;

    return (
      <div
        style={{
          color: "white",
          position: "relative",
          height: "calc(100% - 50px)",
          background: COLORS.BACKGROUND_CONSOLE,
        }}
        onKeyUp={this.debouncedHandleUpdate}
      >
        <Editor
          height="100%"
          language="typescript"
          path={CHALLENGE_TEST_EDITOR}
          value={challengeTestCode}
          onMount={this.editorOnMount}
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
              onClick={this.requestCodeFormatting}
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
  }

  getEditorValue = () => {
    if (!this.state.mounted) {
      console.warn("getEditorValue called before editor was ready");
    }

    if (this.editor) {
      return this.editor.getValue();
    }

    return "";
  };

  handleEditorValueUpdate = () => {
    const { challengeId, challengeTestCode } = this.props;

    if (!challengeId) {
      console.warn("[ERROR] No challenge ID provided");
      return;
    }

    const testCode = this.getEditorValue();
    const shouldUpdate = testCode !== challengeTestCode;

    if (shouldUpdate) {
      this.props.updateChallenge({
        id: challengeId,
        challenge: { testCode },
      });
    }
  };

  requestCodeFormatting = () => {
    if (!this.props.challengeId) {
      console.warn("[ERROR] No challenge ID provided");
      return;
    }

    requestCodeFormatting({
      type: "typescript",
      code: this.getEditorValue(),
      channel: CODE_FORMAT_CHANNEL,
    });
  };

  handleCodeFormat = (e: CodeFormatMessageEvent) => {
    const { challengeId, updateChallenge } = this.props;
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
}

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

type IProps = ReturnType<typeof mergeProps>;

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default connect(
  mapStateToProps,
  dispatchProps,
  mergeProps,
)(ChallengeTestEditor);
