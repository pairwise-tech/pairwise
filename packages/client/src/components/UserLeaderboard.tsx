import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
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
    const { userLeaderboard } = this.props;

    if (!userLeaderboard) {
      return null;
    }

    let userIndex = 0;
    for (const user of userLeaderboard) {
      userIndex++;
      if (user.isUser) {
        break;
      }
    }

    return (
      <PageContainer>
        <PageTitle>User Leaderboard</PageTitle>
        <RankTitle>Your position: {userIndex}</RankTitle>
        {userLeaderboard.map((x, i) => {
          return (
            <TextItem
              style={{ textDecoration: x.isUser ? "underline" : "none" }}
              key={x.id}
            >
              Rank {i} ({x.completedChallenges} completed challenges)
            </TextItem>
          );
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

const RankTitle = styled(Text)`
  margin-top: 12px;
  font-size: 18px;
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

const dispatchProps = {};

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

type IProps = ConnectProps;

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default withProps(UserLeaderboard);
