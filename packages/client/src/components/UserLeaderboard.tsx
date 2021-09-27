import React from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import { Button, Icon } from "@blueprintjs/core";
import Modules, { ReduxStoreState } from "modules/root";
import { PageContainer, Text, PageTitle } from "./SharedComponents";
import { COLORS } from "tools/constants";
import { themeColor } from "./ThemeContainer";
import { REACT_APP_WEB_SOCKET_HOST } from "../tools/client-env";
import io, { Socket } from "socket.io-client";
import {
  assertUnreachable,
  createInverseChallengeMapping,
  LeaderboardEntryDto,
  SocketClientEventTypes,
  SocketServerEvents,
  SocketServerEventTypes,
} from "@pairwise/common";
import SEO from "./SEO";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

export interface RealTimeChallengeUpdate {
  id: string;
  complete: boolean;
  challengeId: string;
}

interface IState {
  socketIOConnected: boolean;
  realtimeChallengeUpdates: RealTimeChallengeUpdate[];
}

// 12.5 seconds to clear realtime challenge activity updates
const UPDATE_CANCELLATION_DELAY = 12500;

/** ===========================================================================
 * Account
 * ============================================================================
 */

class UserLeaderboard extends React.Component<IProps, IState> {
  socket_io_reconnect_timer: Nullable<NodeJS.Timeout> = null;
  updates_timers: NodeJS.Timeout[] = [];
  socket: Nullable<Socket> = null;
  socketCloseUnmountReason = "componentWillUnmount";

  constructor(props: IProps) {
    super(props);

    this.state = {
      socketIOConnected: false,
      realtimeChallengeUpdates: [],
    };
  }

  componentDidMount() {
    this.props.fetchUserLeaderboard();
    this.initializeWebSocketConnection();
  }

  componentWillUnmount() {
    if (this.socket) {
      // Close code reference: https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent/code
      this.socket.disconnect();
      this.socket = null;
    }

    if (this.socket_io_reconnect_timer) {
      clearTimeout(this.socket_io_reconnect_timer);
    }

    for (const timer of this.updates_timers) {
      clearTimeout(timer);
    }
  }

  /**
   * How to broadcast data from the client to the server.
   */
  emitSocketMessage = (event: string, data: any) => {
    if (this.socket) {
      this.socket.emit(event, data, (response: any) => {
        console.log("SocketIO Response: ", response);
      });
    }
  };

  /**
   * If this is to be used outside of this component, it could be integrated
   * in the RxJS middleware layer. This is how it is setup in the admin app,
   * see there for details.
   */
  initializeWebSocketConnection = async (retries = 5) => {
    // Cancel if retries reach 0
    if (retries === 0) {
      console.log(
        "Retry limited exceeded, aborting WebSocket reconnection attempt.",
      );
      return;
    }

    try {
      // Create WebSocket connection.
      const socket = io(REACT_APP_WEB_SOCKET_HOST, {
        transports: ["websocket"],
      });

      // Connection opened
      socket.on("connect", () => {
        console.log("WebSocket connection established.");
        this.setState({ socketIOConnected: true }, () => {
          // Broadcast client connection event
          socket.emit(SocketClientEventTypes.WORKSPACE_CLIENT_CONNECTED);
        });
      });

      socket.on("disconnect", (reason: string) => {
        this.setState({ socketIOConnected: false });

        // No op on componentWillUnmount
        if (reason === "io client disconnect") {
          console.log("WebSocket connection closed by the client.");
          return;
        } else if (reason === "transport close") {
          /**
           * The connection may disconnect if the Cloud Run server instance
           * re-deploys and the primary active WebSocket instance changes. In
           * this case try to reconnect the client again.
           */
          console.log(
            "WebSocket connection disconnected, trying to reconnect:",
          );

          // Wait 1 second before retry
          this.socket_io_reconnect_timer = setTimeout(() => {
            this.initializeWebSocketConnection(retries - 1);
          }, 1000);
        }
      });

      // Listen for messages
      socket.on("message", (event: SocketServerEvents) => {
        try {
          switch (event.type) {
            case SocketServerEventTypes.REAL_TIME_CHALLENGE_UPDATE: {
              const message = event.payload;
              this.setState(
                (ps) => ({
                  realtimeChallengeUpdates:
                    ps.realtimeChallengeUpdates.concat(message),
                }),
                () => {
                  this.setCancelTimeoutOnChallengeUpdate(message.id);
                },
              );
              break;
            }

            case SocketServerEventTypes.CONNECTED_USER_COUNT_UPDATE: {
              // No op
              break;
            }

            default: {
              assertUnreachable(event);
            }
          }
        } catch (err) {
          // No op
          console.log("Error handling WebSocket message", err);
        }
      });

      this.socket = socket;
    } catch (err) {
      console.log("Error initializing web socket connection", err);
      this.initializeWebSocketConnection(retries - 1);
    }
  };

  /**
   * Remove the given update by id after a delay.
   */
  setCancelTimeoutOnChallengeUpdate = (updateId: string) => {
    const timer = setTimeout(() => {
      this.setState((ps) => ({
        realtimeChallengeUpdates: ps.realtimeChallengeUpdates.filter(
          (x) => x.id !== updateId,
        ),
      }));
    }, UPDATE_CANCELLATION_DELAY);

    this.updates_timers.push(timer);
  };

  render(): Nullable<JSX.Element> {
    const { realtimeChallengeUpdates, socketIOConnected } = this.state;
    const {
      courses,
      userLeaderboardState,
      fetchUserLeaderboard,
      recentProgressRecordStats,
      loadingRecentProgressStats,
    } = this.props;
    const { loading, error, leaderboard } = userLeaderboardState;

    if (!leaderboard || !courses) {
      return null;
    }

    if (loading || error) {
      return (
        <PageContainer>
          <PageTitle>User Leaderboard Rankings</PageTitle>
          {loading && <TextItem>Loading Rankings...</TextItem>}
          {error && (
            <TextItem>An error occurred loading the leaderboard...</TextItem>
          )}
        </PageContainer>
      );
    }

    const challengeMap = createInverseChallengeMapping(courses);

    let userIndex = 0;
    let exists = false;
    for (const user of leaderboard) {
      userIndex++;
      if (user.isUser) {
        exists = true;
        break;
      }
    }

    return (
      <PageContainer>
        <SEO
          title="User Leaderboard"
          description="View Pairwise user leaderboard rankings"
        />
        <PageTitle>Recent Activity Updates</PageTitle>
        <Button
          icon="refresh"
          text="Refresh Data"
          onClick={fetchUserLeaderboard}
        />
        <RecentStatsBox>
          <TextItem style={{ fontWeight: "bold", textDecoration: "underline" }}>
            Realtime Challenge Updates:
          </TextItem>
          <SocketIOText socketIOConnected={socketIOConnected}>
            {socketIOConnected ? "Connected" : "Disconnected..."}
          </SocketIOText>
          {realtimeChallengeUpdates.length > 0 ? (
            <>
              {realtimeChallengeUpdates.map((update) => {
                const { challenge } = challengeMap[update.challengeId];
                return (
                  <TextItem
                    style={{
                      marginTop: 0,
                      color: update.complete
                        ? COLORS.PRIMARY_GREEN
                        : COLORS.SECONDARY_YELLOW,
                    }}
                  >
                    "{challenge.title}" Challenge{" "}
                    {update.complete ? "Solved!" : "Attempted"}
                  </TextItem>
                );
              })}
            </>
          ) : (
            <TextItem style={{ marginTop: 0, color: COLORS.LIGHT_GREY }}>
              Watching for challenge updates...
            </TextItem>
          )}
          {loadingRecentProgressStats ? (
            <TextItem>Loading recent stats...</TextItem>
          ) : recentProgressRecordStats === null ? (
            <TextItem>No recent stats...</TextItem>
          ) : (
            <>
              <TextItem
                style={{ fontWeight: "bold", textDecoration: "underline" }}
              >
                Previous 24 Hour Stats:
              </TextItem>
              <TextItem>
                {recentProgressRecordStats?.totalUsersCount} total users active
              </TextItem>
              <TextItem>
                {recentProgressRecordStats?.completedChallengesCount} total
                completed challenges
              </TextItem>
            </>
          )}
        </RecentStatsBox>
        <PageTitle>User Leaderboard Rankings</PageTitle>
        {!exists ? (
          <TextItem style={{ fontStyle: "italic" }}>
            Complete some challenges to enter the rankings.
          </TextItem>
        ) : (
          <RankTitle>Your position: {userIndex}</RankTitle>
        )}
        <TextItem style={{ marginBottom: 16 }}>
          Usernames are displayed in blue, for users who choose to share them.
          To display your username publicly in the leaderboard rankings, visit{" "}
          <Link to="account">your account page</Link> and enable the option for
          sharing your public profile.
        </TextItem>
        {leaderboard.map((x, i) => {
          if (x.isUser) {
            return (
              <UserRank key={i}>
                <Underline>
                  Rank {i + 1} ({x.completedChallenges} completed challenges)
                </Underline>
                <Icon style={{ marginLeft: 4 }} icon="star" />
                {renderUsername(x)}
              </UserRank>
            );
          } else {
            return (
              <TextItem key={i}>
                Rank {i + 1} ({x.completedChallenges} completed challenges)
                {renderUsername(x)}
              </TextItem>
            );
          }
        })}
      </PageContainer>
    );
  }
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const TextItem = styled(Text)`
  margin-top: 12px;
  max-width: 500px;
  ${themeColor("color", COLORS.TEXT_CONTENT_BRIGHT)};
`;

const UserRank = styled(Text)`
  margin-top: 12px;
  ${themeColor("color", COLORS.PRIMARY_GREEN, COLORS.PINK)};
`;

const Underline = styled.span`
  text-decoration: underline;
`;

const Username = styled.span`
  margin-left: 4px;
  ${themeColor("color", COLORS.PRIMARY_BLUE, COLORS.SECONDARY_PINK)};
`;

const renderUsername = (x: LeaderboardEntryDto) => {
  if (x.username !== null) {
    return <Username>{x.username}</Username>;
  } else {
    return "";
  }
};

const RankTitle = styled(Text)`
  margin-top: 12px;
  font-size: 22px;
  font-weight: bold;
  ${themeColor("color", COLORS.TEXT_CONTENT_BRIGHT)};
`;

const RecentStatsBox = styled.div`
  margin-top: 12px;
  margin-bottom: 12px;
  max-width: 450px;
  padding: 4px 12px 18px 12px;
  border-radius: 4px;

  ${themeColor("background", COLORS.BACKGROUND_MODAL_DARK, COLORS.GRAY)};
`;

const SocketIOText = styled.p<{ socketIOConnected: boolean }>`
  margin-top: 6px;
  margin-bottom: 0;
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
  courses: Modules.selectors.challenges.getCourseList(state),
  userLeaderboardState: Modules.selectors.user.userLeaderboardState(state),
  recentProgressRecordStats:
    Modules.selectors.app.recentProgressRecordStats(state),
  loadingRecentProgressStats:
    Modules.selectors.app.loadingRecentProgressStats(state),
});

const dispatchProps = {
  fetchUserLeaderboard: Modules.actions.user.fetchUserLeaderboard,
};

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

type IProps = ConnectProps;

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default withProps(UserLeaderboard);
