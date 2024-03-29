import { isMobile } from "react-device-detect";
import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import ReactDiffViewer from "react-diff-viewer";
import Modules, { ReduxStoreState } from "modules/root";
import {
  Row,
  KeyValue,
  SummaryText,
  PageContainer,
  PullRequestDiffInput,
  ExternalLink,
} from "./AdminComponents";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { Button, Card, Switch } from "@blueprintjs/core";
import { COLORS } from "../tools/constants";
import { composeWithProps } from "../tools/admin-utils";
import {
  InverseChallengeMapping,
  PullRequestDiffContext,
} from "@pairwise/common";
import { defaultTextColor, themeColor, themeText } from "./AdminThemeContainer";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface IState {
  pull: string;
}

/** ===========================================================================
 * AdminPullRequestPage Component
 * ============================================================================
 */

class AdminPullRequestPage extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.state = {
      pull: "",
    };
  }

  render(): Nullable<JSX.Element> {
    const {
      challengeMap,
      pullRequestContext,
      adminUserSettings,
      pullRequestContextLoading,
    } = this.props;

    const isDark = adminUserSettings.appTheme === "dark";
    const id = this.getPullIdFromParams();
    const showLink = !pullRequestContextLoading && !!pullRequestContext && !!id;
    const prURL = `https://github.com/pairwise-tech/pairwise/pull/${id}`;
    const workspaceURL = `https://app.pairwise.tech/admin/pull-request?pullRequestId=${id}`;
    return (
      <PageContainer>
        <Title>Pull Request Content Diffs</Title>
        <form>
          <Row>
            <PullRequestDiffInput
              fill
              autoFocus
              leftIcon="search"
              id="pull-input"
              autoComplete="off"
              value={this.state.pull}
              onChange={this.handleChange}
              onSubmit={this.handleSearchPullRequest}
              placeholder="Enter a GitHub pull request number"
            />
            <Button type="submit" onClick={this.handleSearchPullRequest}>
              Search
            </Button>
          </Row>
        </form>
        {showLink && (
          <SummaryText>
            Showing diff for: <ExternalLink link={prURL}>{prURL}</ExternalLink>.
            You can also view the modified course content in the{" "}
            <ExternalLink link={workspaceURL}>Pairwise workspace</ExternalLink>.
          </SummaryText>
        )}
        {pullRequestContextLoading ? (
          <SummaryText>Loading pull request diff content...</SummaryText>
        ) : pullRequestContext ? (
          <DiffContent
            isMobile={isMobile}
            challengeMap={challengeMap}
            diffContent={pullRequestContext}
            useDarkTheme={isDark}
          />
        ) : !id ? (
          <div />
        ) : (
          <SummaryText>No results found for pull request.</SummaryText>
        )}
      </PageContainer>
    );
  }

  handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ pull: e.target.value });
  };

  handleSearchPullRequest = (e: any) => {
    e.preventDefault();
    /**
     * Trigger the search through a url update so the result pages
     * is deep linked. The actual search occurs in the challenge/epics
     * as a result of the route location change.
     */
    this.props.history.push(`/pull-requests/${this.state.pull}`);
  };

  getPullIdFromParams = (): Nullable<string> => {
    const params: any = this.props.match.params;
    if (params.pull && typeof params.pull === "string") {
      return params.pull;
    }

    return null;
  };
}

export const PULL_REQUEST_DIFF_VIEW_ID = "pull-request-diff-view";

interface DiffContentProps {
  isMobile: boolean;
  useDarkTheme: boolean;
  diffContent: PullRequestDiffContext[];
  challengeMap: Nullable<InverseChallengeMapping>;
}

/**
 * Uses this cool diff viewer component:
 *
 * - https://github.com/praneshr/react-diff-viewer
 */
class DiffContent extends React.PureComponent<DiffContentProps, {}> {
  render(): JSX.Element {
    const { diffContent } = this.props;
    if (Array.isArray(diffContent)) {
      return (
        <React.Fragment>
          {this.props.diffContent.map(this.renderPullRequestContext)}
        </React.Fragment>
      );
    } else {
      return <SummaryText>{diffContent}</SummaryText>;
    }
  }

  renderPullRequestContext = (context: PullRequestDiffContext) => {
    const { challengeMap } = this.props;
    const isDeletedChallenge = !context.updatedChallenge;
    const isNewChallenge = !context.originalChallenge && !isDeletedChallenge;

    const title = isDeletedChallenge
      ? "Deleted Challenge"
      : isNewChallenge
      ? "New Challenge"
      : "Updated Challenge";

    const notFoundChallenge = {
      moduleId: "undetermined",
      courseId: "undetermined",
    };

    const challengeDetails = challengeMap
      ? challengeMap[context.id]
      : notFoundChallenge;

    const moduleId = context.moduleId || challengeDetails.moduleId;
    const courseId = context.courseId || challengeDetails.courseId;

    return (
      <div key={context.id}>
        <ChallengeDiffCard>
          <DiffTitle>{title}</DiffTitle>
          <KeyValue code isChallengeId label="challengeId" value={context.id} />
          <KeyValue code label="moduleId" value={moduleId} />
          <KeyValue code label="courseId" value={courseId} />
          {isNewChallenge && (
            <>
              <KeyValue
                renderAsMarkdown
                label="Instructions"
                value={context.updatedChallenge.instructions}
              />
              <KeyValue
                renderAsMarkdown
                label="Content"
                value={context.updatedChallenge.content}
              />
            </>
          )}
          {!isNewChallenge && this.renderDiffContent(context)}
        </ChallengeDiffCard>
      </div>
    );
  };

  renderDiffContent = (context: PullRequestDiffContext) => {
    const { originalChallenge, updatedChallenge } = context;

    /**
     * Either content or instruction fields may have been changed. Check
     * and render both separately.
     */
    const contentDiff =
      originalChallenge?.content !== updatedChallenge?.content;
    const instructionsDiff =
      originalChallenge?.instructions !== updatedChallenge?.instructions;

    return (
      <ChallengeDiff id={PULL_REQUEST_DIFF_VIEW_ID}>
        <div style={{ height: 18 }} />
        {contentDiff && (
          <>
            <DiffTitle>Content Diff:</DiffTitle>
            <ReactDiffViewer
              splitView={!this.props.isMobile}
              useDarkTheme={this.props.useDarkTheme}
              oldValue={context.originalChallenge?.content}
              newValue={context.updatedChallenge?.content}
            />
          </>
        )}
        {instructionsDiff && (
          <>
            <DiffTitle>Instructions Diff:</DiffTitle>
            <ReactDiffViewer
              splitView={!this.props.isMobile}
              useDarkTheme={this.props.useDarkTheme}
              oldValue={context.originalChallenge?.instructions}
              newValue={context.updatedChallenge?.instructions}
            />
          </>
        )}
        {!contentDiff && !instructionsDiff && (
          <SubTitle>
            No diff exists for the challenge content or instructions.
          </SubTitle>
        )}
      </ChallengeDiff>
    );
  };
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const Title = styled.h2`
  ${defaultTextColor};
`;

const DiffTitle = styled.h3`
  margin-top: 8px;
  margin-bottom: 16px;
  font-family: Avenir, Arial, Helvetica, sans-serif;
  ${themeText(COLORS.SECONDARY_YELLOW, COLORS.TEXT_LIGHT_THEME)};
`;

const SubTitle = styled.p`
  font-family: Avenir, Arial, Helvetica, sans-serif;
  ${defaultTextColor};
`;

const ChallengeDiff = styled.div`
  overflow-x: scroll;
`;

const ChallengeDiffCard = styled(Card)`
  margin-top: 12px;
  ${themeColor(
    "background",
    COLORS.BACKGROUND_CARD_DARK,
    COLORS.BACKGROUND_CARD_LIGHT,
  )}
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  adminUserSettings: Modules.selectors.admin.adminUserSettings(state),
  pullRequestContext: Modules.selectors.challenges.pullRequestContext(state),
  pullRequestContextLoading:
    Modules.selectors.challenges.pullRequestContextLoading(state),
  challengeMap: Modules.selectors.challenges.getChallengeMap(state),
});

const dispatchProps = {
  fetchPullRequestContext: Modules.actions.challenges.fetchPullRequestContext,
};

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

interface ComponentProps {}

type IProps = ConnectProps & RouteComponentProps & ComponentProps;

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default composeWithProps<ComponentProps>(withProps)(
  withRouter(AdminPullRequestPage),
);
