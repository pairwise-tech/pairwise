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
import { getRecentProgressRecordsChartData } from "../tools/admin-chart-utils";
import { COLORS, MOBILE } from "../tools/constants";
import { Button, Icon } from "@blueprintjs/core";
import { Link } from "react-router-dom";
import { themeText } from "./AdminThemeContainer";
import {
  createInverseChallengeMapping,
  RecentProgressAdminDto,
} from "@pairwise/common";
import TimeSinceRefresh from "./TimeElapsedBar";
import AdminChartComponent from "./AdminChartComponent";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface IState {
  filterOnlyRegisteredUsers: boolean;
}

/** ===========================================================================
 * Home Component
 * ============================================================================
 */

class AdminStatsPage extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.state = {
      filterOnlyRegisteredUsers: true,
    };
  }

  componentDidUpdate(prevProps: IProps) {
    // If there are no registered users, flip the flag to show all records
    const { progressRecords } = this.props;

    // Only check once the progress records are fetched
    if (!prevProps.progressRecords && !!progressRecords) {
      if (progressRecords.records && progressRecords.records.length > 0) {
        const anyRegisteredUser = progressRecords.records.some(
          (x) => !x.user.includes("Anonymous"),
        );
        if (!anyRegisteredUser) {
          this.setState({ filterOnlyRegisteredUsers: false });
        }
      }
    }
  }

  render(): Nullable<JSX.Element> {
    const {
      usersList,
      lastUpdated,
      statsLoading,
      paymentRecords,
      courseSkeletons,
      progressRecords,
      usersListLoading,
      socketIOConnected,
      connectedClientsCount,
    } = this.props;

    // Reduce count by one, to account for the currently connected admin
    // user... not perfect, there could be other admin users.
    const clients = connectedClientsCount - 1;
    const clientConnectedMessage =
      clients > 0
        ? ` - there ${
            clients === 1 ? "is" : "are"
          } currently ${clients} connected client${clients > 1 ? "s" : ""}.`
        : "";

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
            onClick={() =>
              this.props.refreshStats({ disableLoadingState: false })
            }
          >
            Refresh Stats
          </Button>
        </Row>
        <TimeSinceRefresh lastUpdated={lastUpdated} />
        {loading ? (
          <p style={{ color: COLORS.GRAY_TEXT }}>Loading Stats...</p>
        ) : (
          <>
            <Stat>
              <b>Total Registered Users:</b>{" "}
              <Value>{summary.stats.totalUsers.toLocaleString()}</Value>
            </Stat>
            <Stat>
              <b>Total Non-Zero Users:</b>{" "}
              <Value>
                {summary.stats.nonZeroChallengeUsers.toLocaleString()}
              </Value>
            </Stat>
            <Stat>
              <b>Total Ghost Users:</b>{" "}
              <Value>
                {summary.leaderboard.numberOfUsersWithZeroChallengesComplete.toLocaleString()}
              </Value>
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
              <b>Average Challenges/Non-Zero User:</b>{" "}
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
            <Title>Realtime Challenge Updates:</Title>
            <SocketIOText socketIOConnected={socketIOConnected}>
              {socketIOConnected
                ? `Connected${clientConnectedMessage}`
                : "Disconnected..."}
            </SocketIOText>
            {this.renderRealTimeUpdates()}
            <Title>Past 24hr Progress Summary:</Title>
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

  renderRealTimeUpdates = () => {
    const { realtimeChallengeUpdates, courses } = this.props;
    if (!courses) {
      return null;
    }

    const challengeMap = createInverseChallengeMapping(courses);

    return realtimeChallengeUpdates.length === 0 ? (
      <p style={{ color: COLORS.GRAY_TEXT }}>Watching for updates...</p>
    ) : (
      realtimeChallengeUpdates.map((update) => {
        const { challenge } = challengeMap[update.challengeId];
        return (
          <RealTimeUpdateRow>
            <p
              style={{
                marginTop: 2,
                marginRight: 6,
                color: COLORS.PRIMARY_BLUE,
              }}
            >
              "{challenge.title}" Challenge{" "}
              {update.complete ? "Solved!" : "Attempted"}{" "}
            </p>
            <KeyValue
              code
              isChallengeId
              renderChallengeIdOnly
              label="ChallengeId"
              value={update.challengeId}
            />
          </RealTimeUpdateRow>
        );
      })
    );
  };

  renderProgressRecords = (progressRecords: RecentProgressAdminDto) => {
    const { statusMessage = "", stats, records = [] } = progressRecords;
    const { healthRatio } = stats;
    const isDark = this.props.adminUserSettings.appTheme === "dark";

    // Sort by challenge completed count
    const sortedRecords = records.sort(
      (a, b) => b.challenges.length - a.challenges.length,
    );

    if (sortedRecords.length === 0) {
      return <p style={{ color: COLORS.GRAY_TEXT }}>No records yet...</p>;
    }

    const chartData = getRecentProgressRecordsChartData(progressRecords);

    return (
      <>
        <StatusText style={{ color: COLORS.PRIMARY_BLUE }}>
          Current Health Ratio = {healthRatio.toFixed(2)}%
        </StatusText>
        <StatusText>{statusMessage}</StatusText>
        <Title>Past 24hr Completed Challenges per User:</Title>
        <AdminChartComponent
          data={chartData}
          yName="Users"
          xName="Challenges"
          chartWidth={850}
          chartHeight={425}
        />
        <Title>Past 24hr Progress Records:</Title>
        <ControlRow>
          <Button
            icon="filter"
            onClick={this.toggleRecordsFilter}
            style={{ width: 275, margin: 8 }}
          >
            {this.state.filterOnlyRegisteredUsers
              ? "Displaying Registered Users Only"
              : "Displaying All Records"}
          </Button>
        </ControlRow>
        {sortedRecords ? (
          sortedRecords
            .filter((record) => {
              const IS_REGISTERED_USER = !record.user.includes("Anonymous");
              if (this.state.filterOnlyRegisteredUsers) {
                return IS_REGISTERED_USER;
              } else {
                return true;
              }
            })
            .map((record) => {
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
                        style={{ color: isDark ? "white" : "black" }}
                        to={`/search/${record.user}`}
                      >
                        View User
                      </Link>
                    </CardButton>
                  )}
                  <JsonComponent
                    title={`Challenges Completed (${record.challenges.length}):`}
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

  toggleRecordsFilter = () => {
    this.setState((ps) => ({
      filterOnlyRegisteredUsers: !ps.filterOnlyRegisteredUsers,
    }));
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
  ${themeText(COLORS.TEXT_CONTENT_BRIGHT, COLORS.TEXT_LIGHT_THEME)};
`;

const StatusText = styled.p`
  max-width: 750px;
  font-style: italic;
  ${themeText(COLORS.WHITE, COLORS.TEXT_LIGHT_THEME)};
`;

const Value = styled.span`
  ${themeText(COLORS.PRIMARY_GREEN, COLORS.TEXT_LIGHT_THEME)};
`;

const Row = styled.div`
  max-width: 425px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const RealTimeUpdateRow = styled.div`
  display: flex;
  flex-direction: row;
`;

const Title = styled.h2`
  ${themeText(COLORS.SECONDARY_YELLOW, COLORS.TEXT_LIGHT_THEME)};
`;

const ControlRow = styled.div`
  margin-top: 8px;
  display: flex;
  flex-direction: row;

  @media ${MOBILE} {
    flex-direction: column;
  }
`;

const SocketIOText = styled.p<{ socketIOConnected: boolean }>`
  margin: 0;
  font-size: 12px;
  color: ${(props) => {
    return props.socketIOConnected
      ? COLORS.PRIMARY_GREEN
      : COLORS.LIGHT_FAILURE;
  }};
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  courses: Modules.selectors.challenges.courseList(state),
  usersList: Modules.selectors.users.usersState(state).users,
  statsLoading: Modules.selectors.stats.statsLoadingSelector(state),
  socketIOConnected: Modules.selectors.app.socketIOConnected(state),
  adminUserSettings: Modules.selectors.admin.adminUserSettings(state),
  usersListLoading: Modules.selectors.users.usersState(state).loading,
  courseSkeletons: Modules.selectors.challenges.courseSkeletons(state),
  progressRecords: Modules.selectors.stats.progressRecordsSelector(state),
  connectedClientsCount: Modules.selectors.app.connectedClientsSelector(state),
  lastUpdated:
    Modules.selectors.stats.progressRecordsLastUpdatedSelector(state),
  paymentRecords: Modules.selectors.payments.paymentRecordsSelector(state),
  realtimeChallengeUpdates:
    Modules.selectors.app.realtimeChallengeUpdates(state),
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
