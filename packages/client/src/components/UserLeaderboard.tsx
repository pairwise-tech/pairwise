import React from "react";
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
  SocketEvents,
  SocketEventTypes,
} from "@pairwise/common";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface IState {
  realtimeChallengeSolvedId: Nullable<string>;
}

/** ===========================================================================
 * Account
 * ============================================================================
 */

class UserLeaderboard extends React.Component<IProps, IState> {
  timer_one: Nullable<NodeJS.Timeout> = null;
  timer_two: Nullable<NodeJS.Timeout> = null;
  socket: Nullable<Socket> = null;
  socketCloseUnmountReason = "componentWillUnmount";

  constructor(props: IProps) {
    super(props);

    this.state = {
      realtimeChallengeSolvedId: null,
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

    if (this.timer_one) {
      clearTimeout(this.timer_one);
    }

    if (this.timer_two) {
      clearTimeout(this.timer_two);
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
   * in the RxJS middleware layer.
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
      });

      socket.on("disconnect", (reason: string) => {
        // No op on componentWillUnmount
        if (reason === "io client disconnect") {
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
          this.timer_two = setTimeout(() => {
            this.initializeWebSocketConnection(retries - 1);
          }, 1000);
        }
      });

      // Listen for messages
      socket.on("message", (event: SocketEvents) => {
        try {
          switch (event.type) {
            case SocketEventTypes.REAL_TIME_CHALLENGE_UPDATE: {
              const message = event.payload.data;
              const { challengeId } = message;
              if (challengeId) {
                this.setState(
                  { realtimeChallengeSolvedId: challengeId },
                  this.setCancelTimeoutOnChallengeUpdate,
                );
              }
              break;
            }

            default: {
              assertUnreachable(event.type);
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

  setCancelTimeoutOnChallengeUpdate = () => {
    /**
     * Clear the realtime challenge update after a timed delay.
     */
    this.timer_one = setTimeout(() => {
      this.setState({ realtimeChallengeSolvedId: null });
    }, 5000);
  };

  render(): Nullable<JSX.Element> {
    const { realtimeChallengeSolvedId } = this.state;
    const { userLeaderboardState, fetchUserLeaderboard } = this.props;
    const { loading, error, leaderboard } = userLeaderboardState;

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

    if (!leaderboard) {
      return null;
    }

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
        <PageTitle>User Leaderboard Rankings</PageTitle>
        <Button
          icon="refresh"
          text="Refresh Rankings"
          onClick={fetchUserLeaderboard}
        />
        {
          <>
            <RankTitle>Recent Challenge Updates:</RankTitle>
            {realtimeChallengeSolvedId ? (
              <TextItem
                style={{ color: COLORS.PRIMARY_GREEN, fontWeight: "bold" }}
              >
                Challenge ID <code>{realtimeChallengeSolvedId}</code> just
                solved!
              </TextItem>
            ) : (
              <TextItem>No recent updates...</TextItem>
            )}
          </>
        }
        {!exists ? (
          <RankTitle>Complete some challenges to enter the rankings.</RankTitle>
        ) : (
          <RankTitle>Your position: {userIndex}</RankTitle>
        )}
        {leaderboard.map((x, i) => {
          if (x.isUser) {
            return (
              <UserRank key={i}>
                Rank {i + 1} ({x.completedChallenges} completed challenges)
                <Icon style={{ marginLeft: 4 }} icon="star" />
              </UserRank>
            );
          } else {
            return (
              <TextItem key={i}>
                Rank {i + 1} ({x.completedChallenges} completed challenges)
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
  ${themeColor("color", COLORS.TEXT_CONTENT_BRIGHT)};
`;

const UserRank = styled(Text)`
  margin-top: 12px;
  text-decoration: underline;
  ${themeColor("color", COLORS.PRIMARY_GREEN, COLORS.PINK)};
`;

const RankTitle = styled(Text)`
  margin-top: 12px;
  font-size: 22px;
  font-weight: bold;
  ${themeColor("color", COLORS.TEXT_CONTENT_BRIGHT)};
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  userLeaderboardState: Modules.selectors.user.userLeaderboardState(state),
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
