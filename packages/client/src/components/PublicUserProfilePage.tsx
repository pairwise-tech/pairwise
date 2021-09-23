import React from "react";
import { RouteComponentProps } from "react-router-dom";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import Modules, { ReduxStoreState } from "modules/root";
import { PageContainer, Text, PageTitle } from "./SharedComponents";
import { COLORS } from "tools/constants";
import { themeColor } from "./ThemeContainer";
import SEO from "./SEO";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface IState {}

/** ===========================================================================
 * PublicUserProfile
 * ----------------------------------------------------------------------------
 * Public user profile page.
 *
 * This is only available if user's opt in with the optInPublicProfile flag
 * on their profile.
 * ============================================================================
 */

class PublicUserProfile extends React.Component<IProps, IState> {
  componentDidMount() {
    this.fetchUserProfile();
  }

  fetchUserProfile = async () => {
    const { pathname } = this.props.history.location;
    const username = pathname.replace("/users/", "");
    this.props.fetchPublicUserProfile({ username });
  };

  render(): Nullable<JSX.Element> {
    const { publicUserProfile } = this.props;
    const { loading, data } = publicUserProfile;

    if (loading) {
      return <p>Loading...</p>;
    }

    if (data.some === false) {
      return (
        <PageContainer>
          <SEO
            title="Public User Profile Page"
            description="View user's public progress"
          />
          <p>No profile found.</p>
        </PageContainer>
      );
    } else {
      const profile = data.value;

      return (
        <PageContainer>
          <SEO
            title="Public User Profile"
            description={`${profile.username}'s public progress'`}
          />
          <PageTitle>{profile.username}'s Profile</PageTitle>
          <Subtitle>User's Challenge Progress:</Subtitle>
          <UserProgress>
            Total attempted challenges: {profile.attemptedChallenges}
          </UserProgress>
          <UserProgress>
            Total completed challenges: {profile.completedChallenges}
          </UserProgress>
          <DescriptionText>
            Opt-in to sharing your profile progress publicly by enabling the
            setting in your account page.
          </DescriptionText>
          <FutureText>
            More updates will be coming here in the future.
          </FutureText>
        </PageContainer>
      );
    }
  }
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const Subtitle = styled(Text)`
  font-weight: bold;
  ${themeColor("color", COLORS.TEXT_CONTENT_BRIGHT)};
`;

const DescriptionText = styled(Text)`
  margin-top: 12px;
  ${themeColor("color", COLORS.GRAY, COLORS.TEXT_DARK)};
`;

const UserProgress = styled(Text)`
  margin-top: 12px;
  ${themeColor("color", COLORS.PRIMARY_GREEN, COLORS.PINK)};
`;

const FutureText = styled.p`
  margin-top: 12px;
  font-size: 14px;
  ${themeColor("color", COLORS.GRAY, COLORS.TEXT_DARK)};
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  publicUserProfile: Modules.selectors.user.publicUserProfile(state),
});

const dispatchProps = {
  fetchPublicUserProfile: Modules.actions.user.fetchPublicUserProfile,
};

type ConnectProps = ReturnType<typeof mapStateToProps> &
  typeof dispatchProps &
  RouteComponentProps;

type IProps = ConnectProps;

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default withProps(PublicUserProfile);
