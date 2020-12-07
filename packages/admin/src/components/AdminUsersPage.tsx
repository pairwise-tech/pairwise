import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import Modules, { ReduxStoreState } from "modules/root";
import { PageContainer, JsonComponent } from "./AdminComponents";

/** ===========================================================================
 * Home Component
 * ============================================================================
 */

class AdminUsersPage extends React.Component<IProps, {}> {
  render(): Nullable<JSX.Element> {
    const { users } = this.props;
    return (
      <PageContainer>
        <Title>Users List</Title>
        {users ? <JsonComponent data={users} /> : null}
      </PageContainer>
    );
  }
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
