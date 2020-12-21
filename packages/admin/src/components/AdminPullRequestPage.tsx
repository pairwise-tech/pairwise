import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import ReactDiffViewer from "react-diff-viewer";
import Modules, { ReduxStoreState } from "modules/root";
import { KeyValue, PageContainer, SummaryText } from "./AdminComponents";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { Button, Card, InputGroup, Switch } from "@blueprintjs/core";
import { COLORS, MOBILE } from "../tools/constants";
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

  componentDidMount() {
    const params: any = this.props.match.params;
    if (params.pull) {
      this.triggerSearch(params.pull);
    }
  }

  render(): Nullable<JSX.Element> {
    const { useDarkTheme } = this.state;
    const { pullRequestContext, pullRequestContextLoading } = this.props;
    return (
      <PageContainer>
        <Title>Pull Request Content Diffs</Title>
        <SummaryText>
          Enter a pull request number to view a content diff.
        </SummaryText>
        <form>
          <Row>
            <Input
              fill
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
          style={{ marginTop: 12, marginBottom: 24 }}
          label={useDarkTheme ? "Dark Theme (on)" : "Dark Theme (off)"}
        />
        {pullRequestContextLoading ? (
          <SummaryText style={{ color: COLORS.TEXT_CONTENT }}>
            Loading pull request diff content...
          </SummaryText>
        ) : pullRequestContext ? (
          <DiffContent
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
     * is deep linked.
     */
    this.props.history.push(`/pull-requests/${this.state.pull}`);
  };

  triggerSearch = (pull: string | number) => {
    const id = Number(pull);

    if (isNaN(id)) {
      toaster.warn("Invalid pull id provided - must be a number!");
    } else {
      this.setState({ pull: "" }, () => {
        this.props.fetchPullRequestContext(id);
      });
    }
  };
}

interface DiffContentProps {
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
    return (
      <React.Fragment>
        {this.props.diffContent.map(this.renderPullRequestContext)}
      </React.Fragment>
    );
  }

  renderPullRequestContext = (context: PullRequestContext) => {
    const isNewChallenge = !context.originalChallenge;
    const title = isNewChallenge ? "New Challenge" : "Updated Challenge";
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
            <>
              <div style={{ height: 18 }} />
              <ChallengeDiff>
                <ReactDiffViewer
                  splitView
                  useDarkTheme={this.props.useDarkTheme}
                  oldValue={context.originalChallenge.content}
                  newValue={context.updatedChallenge.content}
                />
              </ChallengeDiff>
            </>
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
  display: flex;
  flex-direction: row;

  @media ${MOBILE} {
    flex-direction: column;
  }
`;

const ChallengeDiffCard = styled(Card)`
  margin-top: 12px;
  background: ${COLORS.BACKGROUND_CARD} !important;
`;

const Input = styled(InputGroup)`
  margin-right: 6px;

  input#pull-input {
    display: block;
    color: white;
    transition: all 0.15s ease-out;
    background: #3a3a3a;

    &:hover {
      box-shadow: 0 0 0 1px #10ca92, 0 0 0 1px #10ca92,
        0 0 0 3px rgba(16, 202, 146, 0.1), inset 0 0 0 1px rgba(16, 22, 26, 0.1),
        inset 0 1px 1px rgba(16, 22, 26, 0.1);
    }

    &:focus {
      border: none;
      outline: none;
      color: white;
    }

    ::placeholder {
      color: ${COLORS.TEXT_PLACEHOLDER};
    }

    :-ms-input-placeholder {
      color: ${COLORS.TEXT_PLACEHOLDER};
    }

    ::-ms-input-placeholder {
      color: ${COLORS.TEXT_PLACEHOLDER};
    }
  }
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

interface ComponentProps {
  isMobile: boolean;
}

type IProps = ConnectProps & RouteComponentProps & ComponentProps;

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default composeWithProps<ComponentProps>(withProps)(
  withRouter(AdminPullRequestPage),
);
