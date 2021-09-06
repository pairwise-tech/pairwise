import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import { assertUnreachable } from "@pairwise/common";
import Modules, { ReduxStoreState } from "modules/root";
import { PageContainer, SummaryText } from "./AdminComponents";
import { Button, Icon } from "@blueprintjs/core";
import { AdminUserView } from "../modules/users/store";
import { progressHistoryToChallengeCount } from "../tools/admin-utils";
import { COLORS, MOBILE } from "../tools/constants";
import AdminUserComponent from "./AdminUserComponent";

/** ===========================================================================
 * AdminUsersPage Component
 * ============================================================================
 */

type FILTER = "payments" | "challenges" | "updated" | "plan";
type FILTER_DIRECTION = "ASC" | "DESC";

interface IState {
  filter: FILTER;
  uuid: Nullable<string>;
  filterDirection: FILTER_DIRECTION;
}

class AdminUsersPage extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.state = {
      uuid: null,
      filter: "challenges",
      filterDirection: "DESC",
    };
  }

  render(): Nullable<JSX.Element> {
    const { users } = this.props;
    const usersExist = users && users.length > 0;
    return (
      <PageContainer>
        <h2>Users List</h2>
        {usersExist ? (
          this.renderUsers(users)
        ) : (
          <SummaryText>
            There are currently {users.length} total registered users.
          </SummaryText>
        )}
      </PageContainer>
    );
  }

  renderUsers = (users: AdminUserView[]) => {
    const { filter, filterDirection } = this.state;
    const zeroChallengeUsers = [];
    const usersWithProgress = [];

    // Separate users with progress history and those with none, also
    // include users with payments.
    for (const user of users) {
      if (user.payments.length > 0) {
        usersWithProgress.push(user);
      } else if (Object.keys(user.challengeProgressHistory).length === 0) {
        zeroChallengeUsers.push(user);
      } else {
        usersWithProgress.push(user);
      }
    }

    // Order by the current filters
    const sortedUsersList = usersWithProgress.sort((a, b) => {
      let getValue: (user: AdminUserView) => number;

      switch (filter) {
        case "payments":
          getValue = (user: AdminUserView) => user.payments.length;
          break;
        case "challenges":
          getValue = (user: AdminUserView) => {
            return progressHistoryToChallengeCount(
              user.challengeProgressHistory,
            );
          };
          break;
        case "updated":
          getValue = (user: AdminUserView) => {
            return new Date(user.updatedAt).getTime();
          };
          break;
        case "plan":
          getValue = (user: AdminUserView) => {
            return user.payments.some((x) => x.plan === "PREMIUM") ? 1 : 0;
          };
          break;
        default:
          assertUnreachable(filter);
      }

      if (filterDirection === "DESC") {
        return getValue(b) - getValue(a);
      } else {
        return getValue(a) - getValue(b);
      }
    });

    const getSortIcon = (buttonFilter: FILTER) => {
      const active = buttonFilter === filter;
      if (active) {
        const icon = filterDirection === "ASC" ? "sort-asc" : "sort-desc";
        return <Icon icon={icon} color={COLORS.PRIMARY_BLUE} />;
      } else {
        return "search-template";
      }
    };

    return (
      <>
        <SummaryText style={{ maxWidth: 550 }}>
          There are currently {users.length} total registered users. A total of{" "}
          {zeroChallengeUsers.length} have completed zero challenges, and are
          excluded from the following list.
        </SummaryText>
        <ControlRow>
          <Button
            icon={getSortIcon("challenges")}
            style={{ width: 175, marginRight: 8, marginBottom: 8 }}
            onClick={() => this.handleApplyFilters("challenges")}
          >
            Sort by Challenges
          </Button>
          <Button
            icon={getSortIcon("updated")}
            style={{ width: 175, marginRight: 8, marginBottom: 8 }}
            onClick={() => this.handleApplyFilters("updated")}
          >
            Sort by Last Active
          </Button>
          <Button
            icon={getSortIcon("payments")}
            style={{ width: 175, marginRight: 8, marginBottom: 8 }}
            onClick={() => this.handleApplyFilters("payments")}
          >
            Sort by Payments
          </Button>
          <Button
            icon={getSortIcon("plan")}
            style={{ width: 175, marginRight: 8, marginBottom: 8 }}
            onClick={() => this.handleApplyFilters("plan")}
          >
            Filter Premium
          </Button>
        </ControlRow>
        {sortedUsersList.map(this.renderUsersList)}
      </>
    );
  };

  renderUsersList = (user: AdminUserView) => {
    return (
      <AdminUserComponent
        user={user}
        key={user.uuid}
        theme={this.props.adminUserSettings.appTheme}
        challengeBlobCache={this.props.challengeBlobCache}
      />
    );
  };

  handleApplyFilters = (newFilter: FILTER) => {
    const { filter, filterDirection } = this.state;

    let newDirection: FILTER_DIRECTION;
    if (newFilter === filter) {
      newDirection = filterDirection === "ASC" ? "DESC" : "ASC";
    } else {
      newDirection = "DESC";
    }

    this.setState({
      filter: newFilter,
      filterDirection: newDirection,
    });
  };
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const ControlRow = styled.div`
  display: flex;
  flex-direction: row;

  @media ${MOBILE} {
    flex-direction: column;
  }
`;

/** ===========================================================================
 * Props & Export
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  users: Modules.selectors.users.usersState(state).users,
  adminUserSettings: Modules.selectors.admin.adminUserSettings(state),
  challengeBlobCache: Modules.selectors.challenges.challengeBlobCache(state),
});

const dispatchProps = {};

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

type IProps = ConnectProps;

const withProps = connect(mapStateToProps, dispatchProps);

export default withProps(AdminUsersPage);
