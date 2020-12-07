import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import Modules, { ReduxStoreState } from "modules/root";
import { PageContainer } from "./AdminComponents";
import { summarizeUserProgress } from "../tools/admin-utils";

/** ===========================================================================
 * Home Component
 * ============================================================================
 */

class Home extends React.Component<IProps, {}> {
  render(): Nullable<JSX.Element> {
    const { usersList, usersListLoading, progressRecords } = this.props;
    if (usersListLoading) {
      return null;
    }

    const summary = summarizeUserProgress(usersList);
    return (
      <PageContainer>
        <ContentContainer>
          <h2>Current Stats:</h2>
          <Stat>
            <b>Total Users:</b> {summary.stats.totalUsers.toLocaleString()}
          </Stat>
          <Stat>
            <b>New Users Last Week:</b>{" "}
            {summary.stats.newUsersInLastWeek.toLocaleString()}
          </Stat>
          <Stat>
            <b>Total Challenges Completed:</b>{" "}
            {summary.stats.totalChallengesCompleted.toLocaleString()}
          </Stat>
          <Stat>
            <b>Challenges Completed in Last Week:</b>{" "}
            {summary.stats.challengesCompletedInLastWeek.toLocaleString()}
          </Stat>
          <Stat>
            <b>Average Challenges/User:</b>{" "}
            {summary.leaderboard.averageChallengesCompletedPerNonZeroUser.toLocaleString()}
          </Stat>
          <Stat>
            <b>Leader Challenge Count:</b>{" "}
            {summary.leaderboard.leaderChallengeCount.toLocaleString()}
          </Stat>
          {progressRecords ? JSON.stringify(progressRecords) : "No records yet"}
        </ContentContainer>
      </PageContainer>
    );
  }
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const ContentContainer = styled.div`
  padding: 2px 12px;
`;

const Stat = styled.p`
  margin-top: 12px;
  font-size: 14px;
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  usersList: Modules.selectors.users.usersState(state).users,
  usersListLoading: Modules.selectors.users.usersState(state).loading,
  progressRecords: Modules.selectors.realtime.progressRecordsSelector(state),
});

const dispatchProps = {};

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

type IProps = ConnectProps;

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default withProps(Home);
