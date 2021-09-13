import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import { Button, Icon } from "@blueprintjs/core";
import Modules, { ReduxStoreState } from "modules/root";
import { PageContainer, Text, PageTitle } from "./SharedComponents";
import { COLORS } from "tools/constants";
import { themeColor } from "./ThemeContainer";
import { REACT_APP_WEB_SOCKET_HOST } from "../tools/client-env";

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
  timer: Nullable<NodeJS.Timeout> = null;
  socket: Nullable<WebSocket> = null;

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
      this.socket.close();
      this.socket = null;
    }

    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  initializeWebSocketConnection = () => {
    // Create WebSocket connection.
    const socket = new WebSocket(REACT_APP_WEB_SOCKET_HOST);

    // Connection opened
    socket.addEventListener("open", (event) => {
      console.log("WebSocket connection established.");
    });

    // Listen for messages
    socket.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(event.data);
        const { challengeId } = message.data;
        if (challengeId) {
          this.setState(
            { realtimeChallengeSolvedId: challengeId },
            this.setCancelTimeoutOnChallengeUpdate,
          );
        }
      } catch (err) {
        // No op
        console.log(err);
      }
    });

    this.socket = socket;
  };

  setCancelTimeoutOnChallengeUpdate = () => {
    this.timer = setTimeout(() => {
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
