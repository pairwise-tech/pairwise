import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import Modules, { ReduxStoreState } from "modules/root";
import {
  PageContainer,
  JsonComponent,
  DataCard,
  KeyValue,
  CardButton,
} from "./AdminComponents";
import {
  estimateTotalPaymentsRevenue,
  summarizeUserProgress,
} from "../tools/admin-utils";
import { COLORS } from "../tools/constants";
import { ProgressRecords } from "../modules/stats/store";
import { Button } from "@blueprintjs/core";
import { Link } from "react-router-dom";

/** ===========================================================================
 * Home Component
 * ============================================================================
 */

class AdminStatsPage extends React.Component<IProps, {}> {
  render(): Nullable<JSX.Element> {
    const {
      usersList,
      statsLoading,
      paymentRecords,
      courseSkeletons,
      progressRecords,
      usersListLoading,
    } = this.props;

    // Wait for stats and users list to load
    const loading = usersListLoading || statsLoading;
    const summary = summarizeUserProgress(usersList);

    const { totalRevenue, totalNumberOfPayments } =
      estimateTotalPaymentsRevenue(paymentRecords);

    return (
      <PageContainer>
        <Row>
          <Title>Current Stats:</Title>
          <Button
            icon="refresh"
            disabled={statsLoading}
            onClick={this.props.refreshStats}
          >
            Refresh Stats
          </Button>
        </Row>
        {loading ? (
          <p style={{ color: COLORS.GRAY_TEXT }}>Loading Stats...</p>
        ) : (
          <>
            <Stat>
              <b>Total Users:</b>{" "}
              <Value>{summary.stats.totalUsers.toLocaleString()}</Value>
            </Stat>
            <Stat>
              <b>New Users in Last 7 Days:</b>{" "}
              <Value>{summary.stats.newUsersInLastWeek.toLocaleString()}</Value>
            </Stat>
            <Stat>
              <b>Total Challenges Completed:</b>{" "}
              <Value>
                {summary.stats.totalChallengesCompleted.toLocaleString()}
              </Value>
            </Stat>
            <Stat>
              <b>Challenges Completed in Last 7 Days:</b>{" "}
              <Value>
                {summary.stats.challengesCompletedInLastWeek.toLocaleString()}
              </Value>
            </Stat>
            <Stat>
              <b>Average Challenges/User:</b>{" "}
              <Value>
                {summary.leaderboard.averageChallengesCompletedPerNonZeroUser >
                0
                  ? summary.leaderboard.averageChallengesCompletedPerNonZeroUser.toLocaleString()
                  : 0}
              </Value>
            </Stat>
            <Stat>
              <b>Leader Challenge Count:</b>{" "}
              <Value>
                {summary.leaderboard.leaderChallengeCount.toLocaleString()}
              </Value>
            </Stat>
            <Stat>
              <b>Total Number of Payments:</b>{" "}
              <Value>{totalNumberOfPayments.toLocaleString()}</Value>
            </Stat>
            <Stat>
              <b>Total Course Revenue:</b>{" "}
              <Value>${totalRevenue.toFixed(0)}</Value>
            </Stat>
            <Title>Course Summaries:</Title>
            {courseSkeletons && courseSkeletons.length > 0 && (
              <Stat>
                <span>Course Title</span>
                <span>Number of Challenges</span>
              </Stat>
            )}
            {courseSkeletons?.map((skeleton) => {
              const { id, title, modules } = skeleton;
              const challenges: number = modules.reduce(
                (total, courseModule) => {
                  return total + courseModule.challenges.length;
                },
                0,
              );
              return (
                <Stat key={id}>
                  <b>{title}</b>
                  <Value>{challenges}</Value>
                </Stat>
              );
            })}
            <Title>Recent Challenge Progress:</Title>
            {progressRecords ? (
              this.renderProgressRecords(progressRecords)
            ) : (
              <p style={{ color: COLORS.GRAY_TEXT }}>No records yet...</p>
            )}
          </>
        )}
      </PageContainer>
    );
  }

  renderProgressRecords = (progressRecords: ProgressRecords) => {
    const { status, records } = progressRecords;
    return (
      <>
        <p style={{ color: "white", fontStyle: "italic" }}>{status}</p>
        {records ? (
          records.map((record) => {
            const IS_REGISTERED_USER = !record.user.includes("Anonymous");
            return (
              <DataCard key={record.user}>
                <KeyValue
                  allowCopy
                  label="User"
                  value={record.user}
                  code={IS_REGISTERED_USER}
                />
                {IS_REGISTERED_USER && (
                  <CardButton
                    icon="user"
                    style={{ marginTop: 12, marginBottom: 16 }}
                  >
                    <Link
                      style={{ color: "white" }}
                      to={`/search/${record.user}`}
                    >
                      View User
                    </Link>
                  </CardButton>
                )}
                <JsonComponent
                  title="Challenges Completed:"
                  data={record.challenges}
                />
              </DataCard>
            );
          })
        ) : (
          <p style={{ color: COLORS.GRAY_TEXT }}>No records yet...</p>
        )}
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

const Row = styled.div`
  max-width: 425px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h2`
  color: ${COLORS.SECONDARY_YELLOW};
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  usersList: Modules.selectors.users.usersState(state).users,
  statsLoading: Modules.selectors.stats.statsLoadingSelector(state),
  usersListLoading: Modules.selectors.users.usersState(state).loading,
  progressRecords: Modules.selectors.stats.progressRecordsSelector(state),
  paymentRecords: Modules.selectors.payments.paymentRecordsSelector(state),
  courseSkeletons: Modules.selectors.challenges.courseSkeletons(state),
});

const dispatchProps = {
  refreshStats: Modules.actions.stats.refreshStats,
};

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

type IProps = ConnectProps;

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default withProps(AdminStatsPage);
