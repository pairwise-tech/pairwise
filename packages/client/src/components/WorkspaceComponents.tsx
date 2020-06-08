import { connect } from "react-redux";
import Modules, { ReduxStoreState } from "modules/root";
import React, { useEffect, useState, Suspense } from "react";
import Markdown, { ReactMarkdownProps } from "react-markdown";
import styled from "styled-components/macro";
import {
  COLORS as C,
  COLORS,
  CONTENT_SERIALIZE_DEBOUNCE,
  SANDBOX_ID,
} from "../tools/constants";
import { DIMENSIONS as D, HEADER_HEIGHT } from "../tools/dimensions";
import KeyboardShortcuts from "./KeyboardShortcuts";
import { Loading } from "./Shared";
import {
  Icon,
  Collapse,
  Pre,
  EditableText,
  Tooltip,
  Button,
} from "@blueprintjs/core";
import { TestCase } from "tools/test-utils";
import { debounce } from "throttle-debounce";
import ContentEditor, { editorColors } from "./ContentEditor";
import Breadcrumbs from "./Breadcrumbs";

/** ===========================================================================
 * Workspace Components
 * ============================================================================
 */

export const Container = styled.div`
  height: 100%;
  overflow: hidden;
  padding-top: 60px;
`;

export const PageSection = styled.div`
  width: 100vw;
  height: calc(100vh - ${HEADER_HEIGHT}px);
`;

export const LowerSection = styled.div<{ withHeader?: boolean }>`
  width: 100vw;
  height: ${props =>
    props.withHeader ? `calc(100vh - ${HEADER_HEIGHT}px)` : "100vh"};
  padding-top: 30px;
  border-top: 1px solid ${C.DRAGGABLE_SLIDER_BORDER};
  background: ${C.BACKGROUND_LOWER_SECTION};
`;

export const WorkspaceContainer = styled.div`
  width: 100vw;
  height: ${D.WORKSPACE_HEIGHT}px;
`;

export const FrameContainer = styled.iframe`
  height: 100%;
  width: 100%;
  border: none;
  background: white;
`;

export const RunButton = styled(Button)`
  z-index: 3;
  .bp3-icon {
    color: ${COLORS.NEON_GREEN} !important;
  }
`;

/**
 * Our window resizing library is listening for mouse events on
 * window.document.body, however, when the mouse enters an iframe those events
 * fire on document.body _within the iframe_, which causes resizing issues when
 * the pane in question contains an iframe. This component prevents pointer
 * events within the iframe during a drag if that drag was started outside the
 * iframe.
 *
 * NOTE: This is currently a very specific case, but could be refactored into a
 * HOC if it became necessary for other components.
 */
export const DragIgnorantFrameContainer = React.forwardRef(
  ({ style = {}, ...props }: any, ref: any) => {
    const [isDragging, setIsDragging] = useState<boolean>(false);

    useEffect(() => {
      const onMouseDown = () => {
        setIsDragging(true);
      };
      const onMouseUp = () => {
        setIsDragging(false);
      };

      window.document.body.addEventListener("mousedown", onMouseDown);
      window.document.body.addEventListener("mouseup", onMouseUp);

      return () => {
        window.document.body.removeEventListener("mousedown", onMouseDown);
        window.document.body.removeEventListener("mouseup", onMouseUp);
      };
    }, []);

    return (
      <FrameContainer
        ref={ref}
        style={{ ...style, pointerEvents: isDragging ? "none" : "all" }}
        {...props}
      />
    );
  },
);

export const TestResultRow = ({
  message,
  testResult,
  error,
  index,
}: TestCase & { index: number }) => {
  const [showError, setShowError] = React.useState(false);
  const toggleShowError = () => {
    if (!error) {
      return;
    }
    setShowError(!showError);
  };

  return (
    <div>
      <ContentDiv>
        <MinimalButton
          style={{ cursor: error ? "pointer" : "normal" }}
          onClick={toggleShowError}
        >
          {error ? (
            <Icon icon="error" intent="danger" />
          ) : (
            <Icon icon="tick-circle" intent="primary" />
          )}
        </MinimalButton>
        <TestMessageHighlighter source={message} />
        <div
          style={{
            display: "flex",
            width: 140,
            marginLeft: "auto",
            flexDirection: "row",
          }}
        >
          <b style={{ color: C.TEXT_TITLE }}>Status:</b>
          <SuccessFailureText
            testResult={testResult}
            id={`test-result-status-${index}`}
          >
            {testResult ? "Success!" : "Incomplete..."}
          </SuccessFailureText>
        </div>
      </ContentDiv>
      {error && (
        <Collapse isOpen={showError}>
          <Pre>{error}</Pre>
        </Collapse>
      )}
    </div>
  );
};

const HighlightedMarkdown = (props: ReactMarkdownProps) => {
  return (
    <Markdown
      renderers={{
        inlineCode: ({ value }: { value: string }) => (
          <code className="code">{value}</code>
        ),
      }}
      {...props}
    />
  );
};

const TestMessageHighlighter = styled(HighlightedMarkdown)`
  p {
    margin: 0;
  }

  .code {
    padding: 1px 3px;
    display: inline;
    color: rgb(108, 188, 255);
    border-radius: 4px;
    line-height: normal;
    font-size: 85%;
    padding: 3px 6px;
    border: 1px solid ${editorColors.lightBlack};
    background: ${editorColors.almostBlack};
  }
`;

export const consoleRowStyles = {
  paddingTop: 2,
  paddingBottom: 4,
  background: C.BACKGROUND_CONSOLE,
};

export const colSeparatorProps = {
  style: {
    backgroundColor: C.DRAGGABLE_SLIDER,
    borderLeft: `1px solid ${C.DRAGGABLE_SLIDER_BORDER}`,
    borderRight: `1px solid ${C.DRAGGABLE_SLIDER_BORDER}`,
  },
};

export const rowSeparatorProps = {
  style: {
    backgroundColor: C.DRAGGABLE_SLIDER,
    borderTop: `1px solid ${C.DRAGGABLE_SLIDER_BORDER}`,
    borderBottom: `1px solid ${C.DRAGGABLE_SLIDER_BORDER}`,
  },
};

export const ContentContainer = styled.div`
  height: 100%;
  padding: 8px;
  padding-top: 0;
  padding-bottom: 16px;
  overflow-y: auto;
`;

export const Spacer = styled.div`
  height: ${(props: { height: number }) => props.height}px;
`;

export const ContentTitle = styled.h3`
  margin: 0;
  margin-bottom: 12px;
  color: ${C.TEXT_TITLE};
`;

export const MinimalButton = styled.button`
  appearance: none;
  outline: none;
  background: transparent;
  border: none;
`;

export const ContentDiv = styled.div`
  display: flex;
  align-items: center;
  margin: 0;
  margin-top: 8px;
  font-size: 15px;
  font-weight: 200px;
  padding-right: 8px;
  color: ${C.TEXT_CONTENT};
`;

export const SuccessFailureText = styled.p`
  margin: 0;
  margin-left: 4px;
  color: ${(props: { testResult: boolean }) =>
    props.testResult ? C.SUCCESS : C.FAILURE};
`;

export const TabbedInnerNav = styled.div<{ show: boolean }>`
  position: relative;
  display: ${props => (props.show ? "flex" : "none")};
  align-items: center;
  border-bottom: 1px solid black;
`;

export const Tab = styled.div<{ active?: boolean }>`
  display: block;
  padding: 7px 20px;
  cursor: pointer;
  position: relative;
  background: ${props => (props.active ? "#1e1e1e" : "transparent")};
  color: ${props => (props.active ? "white" : "gray")};
  border: 1px solid ${props => (props.active ? "black" : "transparent")};
  border-top: 2px solid
    ${props => (props.active ? COLORS.PRIMARY_GREEN : "transparent")};
  border-bottom: none;
  transition: all 0.2s ease-out;

  &:hover {
    color: white;
  }

  &:after {
    content: "";
    display: block;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    height: 1px;
    background: ${props => (props.active ? "#1e1e1e" : "transparent")};
  }
`;

const TestStatusText = styled.p<{ passing: boolean }>`
  margin: 0;
  color: ${props => (props.passing ? COLORS.NEON_GREEN : COLORS.FAILURE)};
`;

const StatusTab = styled.div`
  top: 7px;
  right: 12px;
  position: absolute;
`;

export const TestStatusTextTab = ({ passing }: { passing: boolean }) => (
  <StatusTab>
    <TestStatusText passing={passing}>
      {passing ? "Tests Passing" : "Tests Failing"}
    </TestStatusText>
  </StatusTab>
);

export const LoginSignupText = styled.h1`
  margin-right: 12px;
  margin-left: 12px;
  font-size: 18px;
  font-weight: 200;
  color: ${COLORS.TEXT_TITLE};
  font-family: Helvetica Neue, Lato, sans-serif;
`;

export const LoginSignupTextInteractive = styled(LoginSignupText)`
  :hover {
    cursor: pointer;
    color: ${COLORS.TEXT_HOVER};
  }
`;

export const ChallengeTitleHeading = styled.h1`
  font-size: 1.2em;
  background: transparent;
  font-weight: bold;
  color: rgb(200, 200, 200);
  display: block;
  width: 100%;
  line-height: 1.5;
  transition: all 0.2s ease-out;
  &:focus {
    background: black;
  }
`;

export const RevealSolutionLabel = ({
  hideSolution,
}: {
  hideSolution: () => void;
}) => (
  <Tooltip content="Click to hide solution" position="left">
    <SolutionWrapper aria-label="hide the solution code" onClick={hideSolution}>
      <SolutionText>Viewing Solution Code</SolutionText>
    </SolutionWrapper>
  </Tooltip>
);

const SolutionWrapper = styled.button`
  border: none;
  padding: 8px;
  margin-bottom: 8px;
  border-radius: 5px;
  background: ${C.REVEAL_SOLUTION_LABEL_BACKGROUND};

  &:hover {
    cursor: pointer;
    background: ${C.REVEAL_SOLUTION_LABEL_BACKGROUND_HOVER};
  }
`;

const SolutionText = styled.p`
  margin: 0;
  color: ${C.PRIMARY_GREEN};
`;

const instructionsMapState = (state: ReduxStoreState) => ({
  instructions:
    Modules.selectors.challenges.getCurrentInstructions(state) || "",
  title: Modules.selectors.challenges.getCurrentTitle(state) || "",
  currentId: Modules.selectors.challenges.getCurrentId(state) || "",
  isEditMode: Modules.selectors.challenges.isEditMode(state),
});

const instructionsMapDispatch = {
  updateChallenge: Modules.actions.challenges.updateChallenge,
};

type InstructionsViewEditProps = ReturnType<typeof instructionsMapState> &
  typeof instructionsMapDispatch;

export const InstructionsViewEdit = connect(
  instructionsMapState,
  instructionsMapDispatch,
)((props: InstructionsViewEditProps) => {
  const { isEditMode, currentId } = props;

  /**
   * @NOTE The function is memoized so that we're not constantly recreating the
   * debounced function.
   * @NOTE The function is debounced because serializing to markdown has a
   * non-trivial performance impact, which is why the underlying lib provides a
   * getter function rather than the string value onChange.
   */
  const handleContent = React.useMemo(
    () =>
      debounce(
        CONTENT_SERIALIZE_DEBOUNCE,
        (serializeEditorContent: () => string) => {
          props.updateChallenge({
            id: currentId,
            challenge: { instructions: serializeEditorContent() },
          });
        },
      ),
    [currentId, props],
  );

  const handleTitle = (title: string) =>
    props.updateChallenge({ id: currentId, challenge: { title } });

  return (
    <div id="workspace-panel-instructions">
      <ChallengeTitleHeading>
        {isEditMode ? (
          <StyledEditableText
            value={props.title}
            onChange={handleTitle}
            disabled={!isEditMode}
          />
        ) : (
          <Breadcrumbs type="workspace" />
        )}
      </ChallengeTitleHeading>
      <Suspense fallback={<Loading />}>
        <ContentEditor
          toc={false}
          autoFocus={false}
          placeholder="Write something beautiful..."
          defaultValue={props.instructions}
          readOnly={!isEditMode}
          spellCheck={isEditMode}
          onChange={handleContent}
        />
      </Suspense>
    </div>
  );
});

const StyledEditableText = styled(EditableText)`
  width: 100%;
`;

const keyboardStateToProps = (state: ReduxStoreState) => ({
  isEditMode: Modules.selectors.challenges.isEditMode(state),
  course: Modules.selectors.challenges.getCurrentCourse(state),
  prevChallengeId: Modules.selectors.challenges.nextPrevChallenges(state).prev
    ?.id,
  nextChallengeId: Modules.selectors.challenges.nextPrevChallenges(state).next
    ?.id,
  currentChallengeId: Modules.selectors.challenges.getCurrentChallengeId(state),
});

const keyboardDispatchProps = {
  saveCourse: Modules.actions.challenges.saveCourse,
  setEditMode: Modules.actions.challenges.setEditMode,
};

const keyboardMergeProps = (
  state: ReturnType<typeof keyboardStateToProps>,
  methods: typeof keyboardDispatchProps,
) => ({
  ...state,
  ...methods,
  toggleEditMode: (e: KeyboardEvent) => {
    e.preventDefault();
    if (state.currentChallengeId !== SANDBOX_ID) {
      methods.setEditMode(!state.isEditMode);
    }
  },
  save: (e: KeyboardEvent) => {
    if (!state.isEditMode) {
      return;
    }

    e.preventDefault();
    if (state.course) {
      methods.saveCourse(state.course);
    } else {
      console.warn("[ERROR] No course to save!");
    }
  },
});

const AdminKeyboardShortcutsComponent = (
  props: ReturnType<typeof keyboardMergeProps>,
) => {
  return (
    <KeyboardShortcuts
      keymap={{
        "cmd+e": props.toggleEditMode,
        "cmd+s": props.save,
      }}
    />
  );
};

export const AdminKeyboardShortcuts = connect(
  keyboardStateToProps,
  keyboardDispatchProps,
  keyboardMergeProps,
)(AdminKeyboardShortcutsComponent);
