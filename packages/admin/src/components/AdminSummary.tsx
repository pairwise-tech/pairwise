import JSONPretty from "react-json-pretty";
import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import Modules, { ReduxStoreState } from "modules/root";
import { PageContainer } from "./AdminComponents";
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
        <ContentContainer>
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
        </ContentContainer>
      </PageContainer>
    );
  }

  renderProgressRecords = (progressRecords: ProgressRecords) => {
    const { status, records } = progressRecords;
    return (
      <>
        <p style={{ color: "white", fontStyle: "italic" }}>{status}</p>
        <JSONPretty
          id="json-pretty"
          data={records}
          theme={{
            key: "color:#fc426d;",
            value: "color:#e97cff;",
            string: "color:#ffdf75;",
            main:
              "background:rgb(35,35,35);padding:8px;max-width:90vw;width:max-content;overflow:scroll;",
          }}
          style={{ fontSize: 14 }}
        />
      </>
    );
  };
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const ContentContainer = styled.div`
  padding: 2px 12px;
`;

const Stat = styled.p`
  max-width: 425px;
  margin-top: 12px;
  font-size: 14px;
  display: flex;
  color: ${COLORS.TEXT_CONTENT_BRIGHT};
  justify-content: space-between;
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
