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
import { COLORS, MOBILE } from "../tools/constants";
import { ProgressRecords } from "../modules/stats/store";
import { Button } from "@blueprintjs/core";
import { Link } from "react-router-dom";
import { themeText } from "./AdminThemeContainer";

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
    const { status = "", records = [] } = progressRecords;
    const isDark = this.props.adminUserSettings.appTheme === "dark";

    // Sort by challenge completed count
    const sortedRecords = records.sort(
      (a, b) => b.challenges.length - a.challenges.length,
    );
    return (
      <>
        <StatusText>{status}</StatusText>
        <ControlRow>
          <Button
            icon="filter"
            onClick={this.toggleRecordsFilter}
            style={{ width: 275, marginRight: 8, marginBottom: 8 }}
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

const Title = styled.h2`
  ${themeText(COLORS.SECONDARY_YELLOW, COLORS.TEXT_LIGHT_THEME)};
`;

const ControlRow = styled.div`
  display: flex;
  flex-direction: row;

  @media ${MOBILE} {
    flex-direction: column;
  }
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  usersList: Modules.selectors.users.usersState(state).users,
  adminUserSettings: Modules.selectors.admin.adminUserSettings(state),
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
