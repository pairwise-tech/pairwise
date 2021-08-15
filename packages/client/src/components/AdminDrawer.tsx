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

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface IState {
  pullRequestId: string;
}

/** ===========================================================================
 * AdminDrawer Component
 * ============================================================================
 */

class AdminDrawer extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.state = {
      pullRequestId: "",
    };
  }

  render(): Nullable<JSX.Element> {
    const {
      isMobile,
      isDarkTheme,
      isUserAdmin,
      challengeMap,
      isAdminDrawerOpen,
      setAdminDrawerState,
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
                <form style={{ marginTop: 0, marginBottom: 12 }}>
                  <InputField
                    autoFocus
                    type="text"
                    id="admin-pull-request-diff-id"
                    placeholder={isMobile ? "id" : "Enter a pull request id"}
                    className={Classes.INPUT}
                    value={this.state.pullRequestId}
                    onChange={(event) =>
                      this.setState({
                        pullRequestId: event.target.value,
                      })
                    }
                    onSubmit={this.handleFetchPullRequestCourseList}
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
                        : "Load Courses"
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
              </AdminControlBox>
            </>
          </div>
        </div>
      </Drawer>
    );
  }

  handleFetchPullRequestCourseList = (e: any) => {
    e.preventDefault();

    const { pullRequestId } = this.state;
    if (pullRequestId !== "") {
      this.props.fetchPullRequestCourseList(pullRequestId);
    }
  };
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const AdminTitle = styled.h1`
  line-height: 32px;
  margin-top: 42px;
  margin-bottom: 18px;
  color: ${COLORS.RED};
`;

const AdminControlBox = styled.div`
  border-radius: 2px;
  padding: 12px 8px;
  border: 1px solid ${COLORS.RED};
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
  ${themeColor("color", COLORS.TEXT_CONTENT)};
`;

const Line = styled.div`
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
  challengeMap: Modules.selectors.challenges.getChallengeMap(state),
  pullRequestChallengeIds:
    Modules.selectors.challenges.pullRequestChallengeIds(state),
  fetchingPullRequestCourses:
    Modules.selectors.challenges.fetchingPullRequestCourses(state),
});

const dispatchProps = {
  setAdminDrawerState: Modules.actions.app.setAdminDrawerState,
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
