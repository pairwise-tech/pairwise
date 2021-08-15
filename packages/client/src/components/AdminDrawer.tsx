import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import { Button, Classes, Drawer } from "@blueprintjs/core";
import Modules, { ReduxStoreState } from "modules/root";
import { COLORS, MOBILE } from "../tools/constants";
import { Text } from "./SharedComponents";
import { themeColor } from "./ThemeContainer";
import { NavLink } from "react-router-dom";
import { getChallengeSlug } from "@pairwise/common";
import { composeWithProps } from "../tools/utils";
import toaster from "../tools/toast-utils";

/** ===========================================================================
 * AdminDrawer Component
 * ---------------------------------------------------------------------------
 * This component is only visible to Pairwise admin users.
 * ============================================================================
 */

class AdminDrawer extends React.Component<IProps, {}> {
  render(): Nullable<JSX.Element> {
    const {
      isMobile,
      isDarkTheme,
      isUserAdmin,
      challengeMap,
      isAdminDrawerOpen,
      adminPullRequestId,
      setAdminDrawerState,
      setAdminPullRequestId,
      pullRequestDataPresent,
      pullRequestChallengeIds,
      fetchingPullRequestCourses,
    } = this.props;

    const challengeIds = Array.from(pullRequestChallengeIds);

    // Only available for admin users
    if (!isUserAdmin) {
      return null;
    }

    return (
      <Drawer
        icon="shield"
        title="Pairwise Admin"
        isOpen={isAdminDrawerOpen}
        className={isDarkTheme ? Classes.DARK : ""}
        onClose={() => setAdminDrawerState({ isOpen: false })}
      >
        <div className={Classes.DRAWER_BODY}>
          <div className={Classes.DIALOG_BODY}>
            <>
              <AdminTitle>Admin Controls</AdminTitle>
              <AdminControlBox>
                <TextItem>
                  <Bold>Load Pull Request Course Content</Bold>
                </TextItem>
                <form
                  style={{ marginTop: 0, marginBottom: 12 }}
                  onSubmit={this.handleFetchPullRequestCourseList}
                >
                  <InputField
                    type="text"
                    autoFocus={!isMobile}
                    disabled={fetchingPullRequestCourses}
                    id="admin-pull-request-diff-id"
                    placeholder={isMobile ? "id" : "Enter a pull request id"}
                    className={Classes.INPUT}
                    value={adminPullRequestId}
                    onChange={(event) =>
                      setAdminPullRequestId(event.target.value)
                    }
                  />
                  <Button
                    style={{ width: isMobile ? 85 : 175, marginTop: 12 }}
                    disabled={fetchingPullRequestCourses}
                    id="admin-pull-request-diff-button"
                    text={
                      fetchingPullRequestCourses
                        ? "Loading..."
                        : isMobile
                        ? "Load"
                        : "Load Content"
                    }
                    onClick={this.handleFetchPullRequestCourseList}
                  />
                  <TextItem>
                    Modified challenges will be highlighted with yellow in the
                    navigation menu.
                  </TextItem>
                </form>
                {challengeMap && challengeIds.length > 0 && (
                  <>
                    <Line />
                    <TextItem>
                      <Bold>Modified Challenges:</Bold>
                    </TextItem>
                    {challengeIds.map((id) => {
                      const challenge = challengeMap[id];
                      if (challenge) {
                        return (
                          <div key={id} style={{ marginTop: 12 }}>
                            <ButtonLink
                              onClick={() =>
                                setAdminDrawerState({ isOpen: false })
                              }
                              to={`/workspace/${getChallengeSlug(
                                challenge.challenge,
                              )}`}
                            >
                              <Button icon={isMobile ? undefined : "git-pull"}>
                                {challenge.challenge.title}
                              </Button>
                            </ButtonLink>
                          </div>
                        );
                      } else {
                        return <p key={id}>No challenge found for id: {id}</p>;
                      }
                    })}
                  </>
                )}
                {pullRequestDataPresent && (
                  <>
                    <Line />
                    <Button
                      icon="reset"
                      text="Reset Course Content"
                      onClick={this.resetCourseContent}
                    />
                  </>
                )}
              </AdminControlBox>
            </>
          </div>
        </div>
      </Drawer>
    );
  }

  handleFetchPullRequestCourseList = (e: any) => {
    e.preventDefault();

    const { adminPullRequestId } = this.props;
    if (adminPullRequestId !== "") {
      this.props.fetchPullRequestCourseList(adminPullRequestId);
    }
  };

  resetCourseContent = () => {
    this.props.fetchCourses();
    this.props.fetchCourseSkeletons();
    this.props.resetPullRequestState();
    this.props.setAdminPullRequestId("");
    this.props.setAdminDrawerState({ isOpen: false });
  };
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const AdminTitle = styled.h1`
  line-height: 32px;
  margin-top: 42px;
  margin-bottom: 12px;
  color: ${COLORS.LIGHT_RED};
  border-bottom: 1px solid ${COLORS.LIGHT_RED};

  @media ${MOBILE} {
    border-bottom: none;
  }
`;

const AdminControlBox = styled.div`
  border-radius: 2px;
  padding: 12px 8px;
`;

const ButtonLink = styled(NavLink)``;

const TextItem = styled(Text)`
  margin-top: 12px;
  ${themeColor("color", COLORS.TEXT_CONTENT_BRIGHT)};
`;

const InputField = styled.input`
  margin: 0;
  margin-top: 12px;
  margin-right: 12px;
  width: 175px;

  ${themeColor("color", COLORS.TEXT_HOVER)};
  ${themeColor(
    "background",
    COLORS.BACKGROUND_CONSOLE_DARK,
    COLORS.BACKGROUND_CONSOLE_LIGHT,
  )};

  @media ${MOBILE} {
    width: 85px;
  }
`;

const Bold = styled.b`
  font-weight: bold;
  ${themeColor("color", COLORS.WHITE)};
`;

const Line = styled.div`
  margin: 12px auto;
  border: ${(props) => {
    const color = props.theme.dark ? COLORS.DARK_BORDER : COLORS.LIGHT_BORDER;
    return `1px solid ${color}`;
  }};
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  isDarkTheme: Modules.selectors.user.isDarkTheme(state),
  isUserAdmin: Modules.selectors.auth.isUserAdmin(state),
  isAdminDrawerOpen: Modules.selectors.app.isAdminDrawerOpen(state),
  adminPullRequestId: Modules.selectors.app.adminPullRequestId(state),
  pullRequestDataPresent:
    Modules.selectors.challenges.pullRequestDataPresent(state),
  challengeMap: Modules.selectors.challenges.getChallengeMap(state),
  pullRequestChallengeIds:
    Modules.selectors.challenges.pullRequestChallengeIds(state),
  fetchingPullRequestCourses:
    Modules.selectors.challenges.fetchingPullRequestCourses(state),
});

const dispatchProps = {
  fetchCourses: Modules.actions.challenges.fetchCourses,
  fetchCourseSkeletons: Modules.actions.challenges.fetchNavigationSkeleton,
  resetPullRequestState: Modules.actions.challenges.resetPullRequestState,
  setAdminDrawerState: Modules.actions.app.setAdminDrawerState,
  setAdminPullRequestId: Modules.actions.app.setAdminPullRequestId,
  fetchPullRequestCourseList:
    Modules.actions.challenges.fetchPullRequestCourseList,
};

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

interface ComponentProps {
  isMobile: boolean;
}

type IProps = ConnectProps & ComponentProps;

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default composeWithProps<ComponentProps>(withProps)(AdminDrawer);
