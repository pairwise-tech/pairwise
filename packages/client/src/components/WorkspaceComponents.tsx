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
  MOBILE,
} from "../tools/constants";
import { getDimensions, HEADER_HEIGHT } from "../tools/dimensions";
import KeyboardShortcuts from "./KeyboardShortcuts";
import { Loading, RotatingIcon } from "./SharedComponents";
import {
  Icon,
  Collapse,
  Pre,
  Text,
  EditableText,
  Button,
  Spinner,
} from "@blueprintjs/core";
import { Tooltip2 } from "@blueprintjs/popover2";
import { TestCase } from "tools/test-utils";
import { debounce } from "throttle-debounce";
import ContentEditor, { editorColors } from "./ContentEditor";
import Breadcrumbs from "./Breadcrumbs";
import { Table, Cell, Column } from "@blueprintjs/table";

const D = getDimensions();

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
  height: ${(props) =>
    props.withHeader ? `calc(100vh - ${HEADER_HEIGHT}px)` : "100vh"};
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
// eslint-disable-next-line
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

export const MinimalButton = styled.button`
  appearance: none;
  outline: none;
  background: transparent;
  border: none;
`;

/**
 * An overlay to display on top of the preview panel when no test results
 * exist.
 */
export const EmptyPreviewCoverPanel = (props: {
  visible: boolean;
  runCodeHandler: () => void;
}) => {
  const { visible, runCodeHandler } = props;
  if (!visible) {
    return null;
  }

  return (
    <PreviewCover>
      <p>Run the code to get started.</p>
      <RunButton
        style={{ zIndex: 100, marginTop: 6 }}
        icon="play"
        onClick={runCodeHandler}
      >
        Run Code
      </RunButton>
    </PreviewCover>
  );
};

const PreviewCover = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  height: 100%;
  width: 100%;
  z-index: 100;
  color: white;
  background: rgb(45, 45, 45);
`;

const HighlightedMarkdown = (props: ReactMarkdownProps) => {
  return (
    <Markdown
      renderers={{
        // eslint-disable-next-line
        inlineCode: ({ value }: { value: string }) => (
          <code className="code">{value}</code>
        ),
      }}
      {...props}
    />
  );
};

const TestMessageHighlighter = styled(HighlightedMarkdown)`
  margin: 0;
  padding: 0;

  p {
    margin: 0;
    margin-right: 12px;
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

const TestStatus = styled.div`
  display: flex;
  width: 140;
  margin-left: auto;
  flex-direction: row;
`;

const StyledTestResultRow = styled.div`
  @media ${MOBILE} {
    position: relative;
    margin-bottom: 12px;

    ${MinimalButton} {
      position: absolute;
      left: 0;
      top: 0;
      transform: translateY(20%) scale(1.2);
    }

    ${ContentDiv}, ${TestStatus} {
      padding-left: 20px;
      display: block;
      p {
        display: inline-block;
      }
    }

    ${TestMessageHighlighter} {
      display: block;
      padding-left: 20px;
    }
  }
`;

export const TestResultRow = ({
  message,
  testResult,
  error,
  index,
  isMobileView,
  testsRunning,
  isPreviewTestResults,
}: TestCase & {
  index: number;
  isMobileView: boolean;
  testsRunning: boolean;
  isPreviewTestResults: boolean;
}) => {
  const [showError, setShowError] = React.useState(false);
  const toggleShowError = () => {
    if (!error) {
      return;
    }
    setShowError(!showError);
  };

  const testStatus = isPreviewTestResults
    ? "no-results"
    : testsRunning
    ? "loading"
    : testResult
    ? "success"
    : "failure";

  const testCaseMessage = isPreviewTestResults
    ? "No results"
    : testsRunning
    ? "Running..."
    : testResult
    ? "Success!"
    : "Incomplete...";

  const TestCaseIcon = isPreviewTestResults ? (
    <Icon icon="circle" intent="warning" />
  ) : testsRunning ? (
    <Icon icon="time" intent="warning" />
  ) : error ? (
    <Icon icon="error" intent="danger" />
  ) : (
    <Icon icon="tick-circle" intent="primary" />
  );

  return (
    <StyledTestResultRow>
      <ContentDiv>
        {isMobileView ? (
          <MinimalButton
            style={{ cursor: error ? "pointer" : "normal" }}
            onClick={toggleShowError}
          >
            {TestCaseIcon}
          </MinimalButton>
        ) : (
          <Tooltip2
            position="right"
            disabled={!Boolean(error)}
            content={showError ? "Hide error" : "Show error"}
          >
            <MinimalButton
              style={{ cursor: error ? "pointer" : "normal" }}
              onClick={toggleShowError}
            >
              {TestCaseIcon}
            </MinimalButton>
          </Tooltip2>
        )}
        <TestMessageHighlighter source={message} />
        <TestStatus>
          <b style={{ color: C.TEXT_TITLE }}>Status:</b>
          <TestCaseStatusText
            testStatus={testStatus}
            id={`test-result-status-${index}`}
          >
            {testCaseMessage}
          </TestCaseStatusText>
        </TestStatus>
      </ContentDiv>
      {error && (
        <Collapse isOpen={showError}>
          <Pre>{error}</Pre>
        </Collapse>
      )}
    </StyledTestResultRow>
  );
};

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
  overflow-y: auto;
  padding-bottom: 16px;
`;

export const Spacer = styled.div`
  height: ${(props: { height: number }) => props.height}px;
`;

export const ContentTitle = styled.h3`
  margin: 0;
  margin-top: 4px;
  margin-left: 2px;
  margin-bottom: 12px;
  color: ${C.TEXT_TITLE};
`;

export const TestCaseStatusText = styled.p`
  margin: 0;
  margin-left: 4px;
  white-space: nowrap;
  color: ${({
    testStatus,
  }: {
    testStatus: "success" | "failure" | "loading" | "no-results";
  }) =>
    testStatus === "loading" || testStatus === "no-results"
      ? C.SECONDARY_YELLOW
      : testStatus === "success"
      ? C.SUCCESS
      : C.FAILURE};
`;

export const TabbedInnerNav = styled.div<{ show: boolean }>`
  position: relative;
  display: ${(props) => (props.show ? "flex" : "none")};
  align-items: center;
  border-bottom: 1px solid black;
`;

export const Tab = styled.div<{ active?: boolean }>`
  display: block;
  padding: 7px 20px;
  cursor: pointer;
  position: relative;
  background: ${(props) => (props.active ? "#1e1e1e" : "transparent")};
  color: ${(props) => (props.active ? "white" : "gray")};
  border: 1px solid ${(props) => (props.active ? "black" : "transparent")};
  border-top: 2px solid
    ${(props) => (props.active ? COLORS.PRIMARY_GREEN : "transparent")};
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
    background: ${(props) => (props.active ? "#1e1e1e" : "transparent")};
  }
`;

const TestStatusText = styled.p`
  margin: 0;
  color: ${({
    testStatus,
  }: {
    testStatus: "success" | "failure" | "loading";
  }) =>
    testStatus === "loading"
      ? C.SECONDARY_YELLOW
      : testStatus === "success"
      ? C.NEON_GREEN
      : C.FAILURE};
`;

const StatusTab = styled.div`
  top: 3px;
  right: 8px;
  position: absolute;
  display: flex;
  align-items: center;
  flex-direction: row;
  justify-content: space-between;
`;

export const TestStatusTextTab = (props: {
  testsRunning: boolean;
  passing: boolean;
  IconButtonProp: JSX.Element;
}) => {
  const { passing, testsRunning, IconButtonProp } = props;

  const testStatus = testsRunning ? "loading" : passing ? "success" : "failure";

  const message = testsRunning
    ? "Running Tests"
    : passing
    ? "Tests Passing"
    : "Tests Failing";

  return (
    <StatusTab>
      <TestStatusText style={{ marginRight: 8 }} testStatus={testStatus}>
        {message}
      </TestStatusText>
      {IconButtonProp}
    </StatusTab>
  );
};

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
  margin: 0;
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
  <Tooltip2 content="Click to hide solution" position="left">
    <SolutionWrapper aria-label="hide the solution code" onClick={hideSolution}>
      <SolutionText>Viewing Solution Code</SolutionText>
    </SolutionWrapper>
  </Tooltip2>
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
  isInstructionsViewCollapsed:
    Modules.selectors.challenges.isInstructionsViewCollapsed(state),
  currentId: Modules.selectors.challenges.getCurrentId(state) || "",
  isEditMode: Modules.selectors.challenges.isEditMode(state),
});

const instructionsMapDispatch = {
  updateChallenge: Modules.actions.challenges.updateChallenge,
  toggleInstructionsView: Modules.actions.challenges.toggleInstructionsView,
};

type InstructionsViewEditProps = ReturnType<typeof instructionsMapState> &
  typeof instructionsMapDispatch & {
    isMobile?: boolean;
  };

export const INSTRUCTIONS_VIEW_PANEL_ID = "workspace-panel-instructions";

export const InstructionsViewEdit = connect(
  instructionsMapState,
  instructionsMapDispatch,
)((props: InstructionsViewEditProps) => {
  const {
    isMobile,
    currentId,
    isEditMode,
    toggleInstructionsView,
    isInstructionsViewCollapsed,
  } = props;

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
    <div
      id={INSTRUCTIONS_VIEW_PANEL_ID}
      style={{
        minHeight: 45,
        padding: "10px",
        paddingTop: "4px",
        transition: "all 0.2s ease",
        overflow: isInstructionsViewCollapsed ? "hidden" : "auto",
        height: isEditMode
          ? "auto"
          : isInstructionsViewCollapsed
          ? "0vh"
          : "25vh",
      }}
    >
      <ChallengeTitleHeading>
        {isEditMode ? (
          <ChallengeTitleContainer>
            <StyledEditableText
              value={props.title}
              onChange={handleTitle}
              disabled={!isEditMode}
            />
          </ChallengeTitleContainer>
        ) : isMobile ? (
          <ChallengeTitleContainer onClick={toggleInstructionsView}>
            <RotatingIcon
              icon="caret-down"
              iconSize={Icon.SIZE_LARGE}
              style={{ marginRight: 6 }}
              isRotated={!isInstructionsViewCollapsed}
            />
            <Text>{props.title}</Text>
          </ChallengeTitleContainer>
        ) : (
          <Breadcrumbs
            type="workspace"
            panelId={INSTRUCTIONS_VIEW_PANEL_ID}
            toggleCollapsed={toggleInstructionsView}
          />
        )}
      </ChallengeTitleHeading>
      <Suspense fallback={<Loading />}>
        <ContentEditor
          toc={false}
          autoFocus={false}
          placeholder="Write something beautiful..."
          readOnly={!isEditMode}
          spellCheck={isEditMode}
          onChange={handleContent}
          defaultValue={props.instructions}
        />
        {isMobile && (
          <Button
            large
            style={{
              marginTop: 20,
              marginBottom: 20,
              width: "100%",
              textAlign: "center",
              background: "rgba(96, 125, 139, 0.14)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
            }}
            onClick={toggleInstructionsView}
          >
            Tap to hide
          </Button>
        )}
      </Suspense>
    </div>
  );
});

const StyledEditableText = styled(EditableText)`
  width: 100%;
`;

const ChallengeTitleContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
`;

const keyboardStateToProps = (state: ReduxStoreState) => ({
  isEditMode: Modules.selectors.challenges.isEditMode(state),
  course: Modules.selectors.challenges.getCurrentCourse(state),
  prevChallengeId:
    Modules.selectors.challenges.nextPrevChallenges(state).prev?.id,
  nextChallengeId:
    Modules.selectors.challenges.nextPrevChallenges(state).next?.id,
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

export const WorkspaceMobileView = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: scroll;

  .tabs {
    flex: 1 100%;
    display: flex;
    flex-direction: column;
  }

  .tab-selection {
    flex-shrink: 0;
    display: flex;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.47);
    justify-content: center;
    position: relative;
    z-index: 4;

    .bp3-button {
      flex: 1 100%;
    }
  }

  .panel {
    height: 100%;
    width: 100%;
    overflow: auto;
    flex: 1 100%;
  }

  .panel-scroll {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: row;
  }

  .test-view-button {
    & > span:first-child {
      position: relative;
      margin-left: 15px;
    }
  }

  .test-container {
    padding-top: 15px;
  }

  .mobile-tests-badge {
    font-size: 10px;
    position: absolute;
    color: white;
    top: 0;
    left: 0;
    border-radius: 100px;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    padding: 0 3px;
    line-height: 15px;
    min-width: 15px;
    font-weight: bold;
    top: 50%;
    transform: translate(-100%, -50%);
    left: -5px;
    color: black;

    &.fail {
      background: #e17e75;
    }
    &.success {
      background: #95ecbe;
    }
  }

  ${ContentContainer} {
    width: 100vw;
    flex-shrink: 0;
    flex-grow: 0;
  }
`;

/**
 * Types and components for displaying SQL Results as table
 */
interface Log {
  method: string;
  data: ReadonlyArray<any>;
}

interface ISqlResultTableProps {
  logs: ReadonlyArray<Log>;
  testResultsLoading: boolean;
}

export const SQLResultsTable = (props: ISqlResultTableProps) => {
  interface ISqlResult {
    rowCount: number;
    command: string;
    rows: {
      [key: string]: any;
    }[];
  }

  interface ITableWrapperProps {
    isMulti: boolean;
    children: React.ReactNode;
  }

  // this component returns either a div or fragment container depending on if
  // there's multiple tables to show. This optimizes the styling/behavior when
  // there's only a single table (css solutions didn't seem to look as good)
  const TableWrapper = (props: ITableWrapperProps) => {
    return props.isMulti ? (
      <div
        style={{
          marginBottom: 20,
        }}
      >
        {props.children}
      </div>
    ) : (
      <>{props.children}</>
    );
  };

  // This function returns the renderer that is responsible for rendering each
  // cell of the results table and provides closure over the required variables
  const getCellRenderer = (sqlResult: ISqlResult, columnName: string) => {
    return function cellRenderer(rowIndex: number) {
      const val = sqlResult.rows[rowIndex][columnName] ?? "[null]";
      return <Cell>{val}</Cell>;
    };
  };

  const NoSqlResultsWrapper = styled.div`
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  `;

  // isolating logs that represent SQL results by looking for the presence
  // of certain keys which we know are a part of SQL logs. Not ideal...
  // For now, we're only expecting to results from SELECT statements
  const isSqlResult = ({ data }: Log) =>
    data[0].rowCount && data[0]?.command === "SELECT";

  // casting to make this easier to work with. Also not ideal..
  const sqlResults = props.logs
    .filter(isSqlResult)
    .map(({ data }) => data[0]) as ISqlResult[];

  if (!sqlResults.length && props.testResultsLoading) {
    return (
      <NoSqlResultsWrapper>
        <div
          style={{
            marginBottom: 15,
          }}
        >
          Waiting for results...
        </div>
        <Spinner intent="primary" />
      </NoSqlResultsWrapper>
    );
  }

  // this should only show if we fail to log the SQL output from the tests
  if (!sqlResults.length && !props.testResultsLoading) {
    return <NoSqlResultsWrapper>No SQL Results</NoSqlResultsWrapper>;
  }

  return (
    <>
      {sqlResults.map((sqlResult, i) => {
        const columnKeys = Object.keys(sqlResult.rows[0]);

        return (
          <TableWrapper isMulti={sqlResults.length > 1} key={`sql_table_${i}`}>
            <Table enableRowResizing={false} numRows={sqlResult.rowCount}>
              {columnKeys.map((name, i) => (
                <Column
                  name={name}
                  id={`sql_column_${i}_${name}`}
                  key={`sql_column_${i}_${name}`}
                  cellRenderer={getCellRenderer(sqlResult, name)}
                />
              ))}
            </Table>
          </TableWrapper>
        );
      })}
    </>
  );
};
