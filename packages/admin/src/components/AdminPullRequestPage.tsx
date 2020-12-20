import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import Modules, { ReduxStoreState } from "modules/root";
import { PageContainer, SummaryText } from "./AdminComponents";
import { Link, RouteComponentProps, withRouter } from "react-router-dom";
import { Button, InputGroup } from "@blueprintjs/core";
import { COLORS, MOBILE } from "../tools/constants";
import { PullRequestContext } from "../modules/challenges/store";
import { ChallengeContextCard } from "./AdminChallengeDetailModal";
import { composeWithProps } from "../tools/admin-utils";
import toaster from "../tools/toast-utils";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface IState {
  pull: string;
}

/** ===========================================================================
 * Home Component
 * ============================================================================
 */

class AdminPullRequestPage extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.state = {
      pull: "",
    };
  }

  componentDidMount() {
    const params: any = this.props.match.params;
    if (params.pull) {
      this.triggerSearch(params.pull);
    }
  }

  render(): Nullable<JSX.Element> {
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
        {pullRequestContextLoading ? (
          <SummaryText>Loading...</SummaryText>
        ) : pullRequestContext ? (
          pullRequestContext.map(this.renderPullRequestContext)
        ) : (
          <SummaryText>No results found.</SummaryText>
        )}
      </PageContainer>
    );
  }

  renderPullRequestContext = (context: PullRequestContext) => {
    return (
      <ChallengeDiff key={context.id}>
        <ChallengeContextCard
          diffType="updated"
          isMobile={false}
          courseId={context.courseId}
          moduleId={context.moduleId}
          challenge={context.updatedChallenge}
        />
        {!this.props.isMobile && <div style={{ width: 22 }} />}
        {context.originalChallenge ? (
          <ChallengeContextCard
            diffType="original"
            isMobile={false}
            courseId={context.courseId}
            moduleId={context.moduleId}
            challenge={context.originalChallenge}
          />
        ) : (
          <SummaryText>No original challenge exists.</SummaryText>
        )}
      </ChallengeDiff>
    );
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
    this.props.history.push(`pull-requests/${this.state.pull}`);
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

const ChallengeDiff = styled.div`
  display: flex;
  flex-direction: row;

  @media ${MOBILE} {
    flex-direction: column;
  }
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
