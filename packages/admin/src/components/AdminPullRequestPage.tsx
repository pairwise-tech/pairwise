import { isMobile } from "react-device-detect";
import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import ReactDiffViewer from "react-diff-viewer";
import Modules, { ReduxStoreState } from "modules/root";
import {
  KeyValue,
  SummaryText,
  PageContainer,
  PullRequestDiffInput,
  ExternalLink,
} from "./AdminComponents";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { Button, Card, Switch } from "@blueprintjs/core";
import { COLORS } from "../tools/constants";
import { PullRequestContext } from "../modules/challenges/store";
import { composeWithProps } from "../tools/admin-utils";
import toaster from "../tools/toast-utils";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface IState {
  pull: string;
  useDarkTheme: boolean;
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
      useDarkTheme: false,
    };
  }

  render(): Nullable<JSX.Element> {
    const { useDarkTheme } = this.state;
    const { pullRequestContext, pullRequestContextLoading } = this.props;
    const id = this.getPullIdFromParams();
    const showLink = !pullRequestContextLoading && !!pullRequestContext && !!id;
    const prURL = `https://github.com/pairwise-tech/pairwise/pull/${id}`;
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
        <Switch
          checked={useDarkTheme}
          onChange={this.toggleDiffTheme}
          style={{ marginTop: 12, marginBottom: 22 }}
          label={useDarkTheme ? "Dark Theme (on)" : "Dark Theme (off)"}
        />
        {showLink && (
          <SummaryText>
            Showing diff for: <ExternalLink link={prURL}>{prURL}</ExternalLink>
          </SummaryText>
        )}
        {pullRequestContextLoading ? (
          <SummaryText style={{ color: COLORS.SECONDARY_YELLOW }}>
            Loading pull request diff content...
          </SummaryText>
        ) : pullRequestContext ? (
          <DiffContent
            isMobile={isMobile}
            diffContent={pullRequestContext}
            useDarkTheme={this.state.useDarkTheme}
          />
        ) : (
          <SummaryText>No results found for pull request.</SummaryText>
        )}
      </PageContainer>
    );
  }

  toggleDiffTheme = () => {
    this.setState(ps => ({ useDarkTheme: !ps.useDarkTheme }));
  };

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

  getPullIdFromParams = () => {
    const params: any = this.props.match.params;
    if (params.pull) {
      return params.pull;
    }

    return null;
  };
}

export const PULL_REQUEST_DIFF_VIEW_ID = "pull-request-diff-view";

interface DiffContentProps {
  isMobile: boolean;
  useDarkTheme: boolean;
  diffContent: PullRequestContext[];
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

  renderPullRequestContext = (context: PullRequestContext) => {
    const isDeletedChallenge = !context.updatedChallenge;
    const isNewChallenge = !context.originalChallenge && !isDeletedChallenge;

    const title = isDeletedChallenge
      ? "Deleted Challenge"
      : isNewChallenge
      ? "New Challenge"
      : "Updated Challenge";

    return (
      <div key={context.id}>
        <ChallengeDiffCard>
          <DiffTitle>{title}</DiffTitle>
          <KeyValue code isChallengeId label="challengeId" value={context.id} />
          <KeyValue code label="moduleId" value={context.moduleId} />
          <KeyValue code label="courseId" value={context.courseId} />
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
          {!isNewChallenge && (
            <ChallengeDiff id={PULL_REQUEST_DIFF_VIEW_ID}>
              <div style={{ height: 18 }} />
              <ReactDiffViewer
                splitView={!this.props.isMobile}
                useDarkTheme={this.props.useDarkTheme}
                oldValue={context.originalChallenge?.content}
                newValue={context.updatedChallenge?.content}
              />
            </ChallengeDiff>
          )}
        </ChallengeDiffCard>
      </div>
    );
  };
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const Title = styled.h2``;

const Row = styled.div`
  max-width: 350px;
  display: flex;
  flex-direction: row;
  margin-top: 4px;
  margin-bottom: 22px;
`;

const DiffTitle = styled.h3`
  margin-top: 8px;
  margin-bottom: 16px;
  color: ${COLORS.SECONDARY_YELLOW};
  font-family: Avenir, Arial, Helvetica, sans-serif;
`;

const ChallengeDiff = styled.div`
  overflow-x: scroll;
`;

const ChallengeDiffCard = styled(Card)`
  margin-top: 12px;
  background: ${COLORS.BACKGROUND_CARD} !important;
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  pullRequestContext: Modules.selectors.challenges.pullRequestContext(state),
  pullRequestContextLoading: Modules.selectors.challenges.pullRequestContextLoading(
    state,
  ),
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
