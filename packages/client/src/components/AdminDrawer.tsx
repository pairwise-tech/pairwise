import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import { Button, Classes, Drawer } from "@blueprintjs/core";
import Modules, { ReduxStoreState } from "modules/root";
import { COLORS } from "../tools/constants";
import { Text, PageTitle } from "./SharedComponents";
import { themeColor } from "./ThemeContainer";

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
      isUserAdmin,
      isAdminDrawerOpen,
      setAdminDrawerState,
      fetchingPullRequestCourses,
    } = this.props;

    // Only available for admin users
    if (!isUserAdmin) {
      return null;
    }

    return (
      <Drawer
        className={Classes.DARK}
        icon="shield"
        title="Pairwise Admin"
        isOpen={isAdminDrawerOpen}
        onClose={() => setAdminDrawerState({ isOpen: false })}
      >
        <div className={Classes.DRAWER_BODY}>
          <div className={Classes.DIALOG_BODY}>
            <>
              <AdminTitle>Admin Controls</AdminTitle>
              <AdminControlBox>
                <TextItem id="profile-display-name">
                  <Bold>Load Pull Request Course Content</Bold>
                </TextItem>
                <div style={{ marginTop: 0, marginBottom: 12 }}>
                  <InputField
                    type="text"
                    id="admin-pull-request-diff-id"
                    placeholder="Enter a pull request id"
                    className={Classes.INPUT}
                    value={this.state.pullRequestId}
                    onChange={(event) =>
                      this.setState({
                        pullRequestId: event.target.value,
                      })
                    }
                  />
                  <Button
                    style={{ width: 175, marginTop: 12 }}
                    disabled={fetchingPullRequestCourses}
                    id="admin-pull-request-diff-button"
                    text={
                      fetchingPullRequestCourses ? "Loading..." : "Load Courses"
                    }
                    onClick={this.handleFetchPullRequestCourseList}
                  />
                  <TextItem>
                    Modified challenges will be highlighted with yellow in the
                    navigation menu.
                  </TextItem>
                </div>
              </AdminControlBox>
            </>
          </div>
        </div>
      </Drawer>
    );
  }

  handleFetchPullRequestCourseList = () => {
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

const AdminTitle = styled(PageTitle)`
  margin-top: 42px;
  margin-bottom: 24px;
  color: ${COLORS.RED};
`;

const AdminControlBox = styled.div`
  border-radius: 2px;
  padding-left: 8px;
  border: 1px solid ${COLORS.RED};
`;

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
`;

const Bold = styled.b`
  font-weight: bold;
  ${themeColor("color", COLORS.TEXT_CONTENT)};
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  isUserAdmin: Modules.selectors.auth.isUserAdmin(state),
  isAdminDrawerOpen: Modules.selectors.app.isAdminDrawerOpen(state),
  fetchingPullRequestCourses:
    Modules.selectors.challenges.fetchingPullRequestCourses(state),
});

const dispatchProps = {
  setAdminDrawerState: Modules.actions.app.setAdminDrawerState,
  fetchPullRequestCourseList:
    Modules.actions.challenges.fetchPullRequestCourseList,
};

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

type IProps = ConnectProps;

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default withProps(AdminDrawer);
