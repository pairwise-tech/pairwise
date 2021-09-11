import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import { Button, Icon } from "@blueprintjs/core";
import Modules, { ReduxStoreState } from "modules/root";
import { PageContainer, Text, PageTitle } from "./SharedComponents";
import { COLORS } from "tools/constants";
import { themeColor } from "./ThemeContainer";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface IState {}

/** ===========================================================================
 * Account
 * ============================================================================
 */

class UserLeaderboard extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.state = {};
  }

  render(): Nullable<JSX.Element> {
    const { userLeaderboard, fetchUserLeaderboard } = this.props;

    if (!userLeaderboard) {
      return null;
    }

    let userIndex = 0;
    let exists = false;
    for (const user of userLeaderboard) {
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
        {!exists ? (
          <RankTitle>Complete some challenges to enter the rankings.</RankTitle>
        ) : (
          <RankTitle>Your position: {userIndex}</RankTitle>
        )}
        {userLeaderboard.map((x, i) => {
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
  userLeaderboard: Modules.selectors.user.userLeaderboard(state),
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
