import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import Modules, { ReduxStoreState } from "modules/root";
import {
  PageContainer,
  JsonComponent,
  DataCard,
  KeyValue,
  SummaryText,
} from "./AdminComponents";
import { Collapse, Button } from "@blueprintjs/core";
import { AdminUserView } from "../modules/users/store";

/** ===========================================================================
 * AdminUsersPage Component
 * ============================================================================
 */

interface IState {
  uuid: Nullable<string>;
}

class AdminUsersPage extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.state = {
      uuid: null,
    };
  }

  render(): Nullable<JSX.Element> {
    const { users } = this.props;
    return (
      <PageContainer>
        <Title>Users List</Title>
        <SummaryText>
          There are currently {users.length} total registered users.
        </SummaryText>
        {users && users.map(this.renderUsersList)}
      </PageContainer>
    );
  }

  renderUsersList = (user: AdminUserView) => {
    const showDetails = this.state.uuid === user.uuid;
    return (
      <DataCard key={user.uuid}>
        <KeyValue label="Email" value={user.email} allowCopy />
        <KeyValue label="uuid" value={user.uuid} code allowCopy />
        <Button
          style={{ marginTop: 6, marginBottom: 12 }}
          onClick={() => {
            if (showDetails) {
              this.setState({ uuid: null });
            } else {
              this.setState({ uuid: user.uuid });
            }
          }}
        >
          {showDetails ? "Hide" : "View"} Details
        </Button>
        <Collapse isOpen={showDetails}>
          <KeyValue label="Given Name" value={user.givenName} />
          <KeyValue label="Family Name" value={user.familyName} />
          <KeyValue label="Display Name" value={user.displayName} />
          <KeyValue
            label="facebookAccountId"
            value={user.facebookAccountId}
            code
          />
          <KeyValue label="githubAccountId" value={user.githubAccountId} code />
          <KeyValue label="googleAccountId" value={user.googleAccountId} code />
          <KeyValue
            label="createdAt"
            value={new Date(user.createdAt).toLocaleString()}
          />
          <KeyValue
            label="updatedAt"
            value={new Date(user.updatedAt).toLocaleString()}
          />
          <div style={{ height: 12 }} />
          <JsonComponent title="Payments:" data={user.payments} />
          <JsonComponent
            title="Challenge Progress:"
            data={user.challengeProgressHistory}
          />
          <JsonComponent
            title="Settings:"
            data={JSON.parse(String(user.settings))}
          />
        </Collapse>
      </DataCard>
    );
  };
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const Title = styled.h2``;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  users: Modules.selectors.users.usersState(state).users,
});

const dispatchProps = {};

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

type IProps = ConnectProps;

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default withProps(AdminUsersPage);
