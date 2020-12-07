import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import Modules, { ReduxStoreState } from "modules/root";
import { PageContainer, JsonComponent } from "./AdminComponents";
import { summarizeUserProgress } from "../tools/admin-utils";
import { COLORS } from "../tools/constants";
import { ProgressRecords } from "../modules/realtime/store";

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
        <h2>Current Stats:</h2>
        <Stat>
          <b>Total Users:</b>{" "}
          <Value>{summary.stats.totalUsers.toLocaleString()}</Value>
        </Stat>
        <Stat>
          <b>New Users Last Week:</b>{" "}
          <Value>{summary.stats.newUsersInLastWeek.toLocaleString()}</Value>
        </Stat>
        <Stat>
          <b>Total Challenges Completed:</b>{" "}
          <Value>
            {summary.stats.totalChallengesCompleted.toLocaleString()}
          </Value>
        </Stat>
        <Stat>
          <b>Challenges Completed in Last Week:</b>{" "}
          <Value>
            {summary.stats.challengesCompletedInLastWeek.toLocaleString()}
          </Value>
        </Stat>
        <Stat>
          <b>Average Challenges/User:</b>{" "}
          <Value>
            {summary.leaderboard.averageChallengesCompletedPerNonZeroUser.toLocaleString()}
          </Value>
        </Stat>
        <Stat>
          <b>Leader Challenge Count:</b>{" "}
          <Value>
            {summary.leaderboard.leaderChallengeCount.toLocaleString()}
          </Value>
        </Stat>
        <h2>Recent Challenge Progress:</h2>
        {progressRecords
          ? this.renderProgressRecords(progressRecords)
          : "No records yet"}
      </PageContainer>
    );
  }

  renderProgressRecords = (progressRecords: ProgressRecords) => {
    const { status, records } = progressRecords;
    return (
      <>
        <p style={{ color: "white", fontStyle: "italic" }}>{status}</p>
        <JsonComponent data={records} />
      </>
    );
  };
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const Stat = styled.p`
  max-width: 425px;
  margin-top: 12px;
  font-size: 14px;
  display: flex;
  justify-content: space-between;
  color: ${COLORS.TEXT_CONTENT_BRIGHT};
`;

const Value = styled.span`
  color: ${COLORS.PRIMARY_GREEN};
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
