import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import Modules, { ReduxStoreState } from "modules/root";
import {
  PageContainer,
  DataCard,
  KeyValue,
  SummaryText,
  CardButtonRow,
  CardButton,
} from "./AdminComponents";
import { Link } from "react-router-dom";
import { Button, InputGroup } from "@blueprintjs/core";
import { COLORS } from "../tools/constants";

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

  render(): Nullable<JSX.Element> {
    const { pullRequestContext, pullRequestContextLoading } = this.props;
    return (
      <PageContainer>
        <Title>Pull Request Content Diffs</Title>
        <SummaryText>
          Enter a pull request number to view a content diff.
        </SummaryText>
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
          <Button onClick={this.handleSearchPullRequest}>Search</Button>
        </Row>
        {pullRequestContextLoading ? (
          <SummaryText>Loading...</SummaryText>
        ) : (
          JSON.stringify(pullRequestContext)
        )}
      </PageContainer>
    );
  }

  handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ pull: e.target.value });
  };

  handleSearchPullRequest = () => {
    const { pull } = this.state;
    const id = Number(pull);
    this.props.fetchPullRequestContext(id);
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

type IProps = ConnectProps;

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default withProps(AdminPullRequestPage);
