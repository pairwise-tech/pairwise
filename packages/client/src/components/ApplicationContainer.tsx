import queryString from "query-string";
import React from "react";
import { connect } from "react-redux";
import { Redirect, Route, Switch } from "react-router";
import styled from "styled-components/macro";

import Modules, { ReduxStoreState } from "modules/root";
import { Link } from "react-router-dom";
import { DEV_MODE } from "tools/client-env";
import { COLORS, HEADER_HEIGHT } from "tools/constants";
import EditingToolbar from "./EditingToolbar";
import Home from "./Home";
import NavigationOverlay from "./NavigationOverlay";
import Profile from "./Profile";
import { ButtonCore, IconButton } from "./shared";
import SingleSignOnHandler from "./SingleSignOnHandler";
import Workspace from "./Workspace";
import {
  Icon,
  Button,
  ButtonGroup,
  Classes,
  Tooltip,
  FocusStyleManager,
} from "@blueprintjs/core";
import cx from "classnames";

// Only show focus outlinewhen tabbing around the UI
FocusStyleManager.onlyShowFocusOnTabs();

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface IState {
  hasHandledRedirect: boolean;
}

/** ===========================================================================
 * ApplicationContainer
 * ----------------------------------------------------------------------------
 * This is the top level component which renders the overall app structure,
 * including the routing Switch torender all child routes.
 * ============================================================================
 */

class ApplicationContainer extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.state = {
      hasHandledRedirect: false,
    };
  }

  componentDidMount() {
    this.props.initializeApp();

    const { accessToken } = queryString.parse(window.location.search);
    if (typeof accessToken === "string" && Boolean(accessToken)) {
      this.props.storeAccessToken({ accessToken });
    }

    this.setState({ hasHandledRedirect: true });
  }

  render(): Nullable<JSX.Element> {
    if (!this.state.hasHandledRedirect) {
      return null;
    }

    const { challenge, nextPrevChallenges, overlayVisible } = this.props;
    const { next, prev } = nextPrevChallenges;

    const displayNavigationArrows = window.location.pathname.includes(
      "workspace",
    );

    if (!challenge) {
      return this.renderLoadingOverlay();
    }

    return (
      <React.Fragment>
        <MobileView />
        <DarkTheme>
          {this.renderLoadingOverlay()}
          <SingleSignOnHandler />
          <NavigationOverlay overlayVisible={overlayVisible} />
          <Header>
            <ControlsContainer style={{ height: "100%", marginRight: 60 }}>
              <NavIconButton
                overlayVisible={overlayVisible}
                style={{ color: "white", marginRight: 40 }}
                onClick={this.props.toggleNavigationMap}
              />
              <ProductTitle id="product-title">
                <Link to="/home">Pairwise</Link>
              </ProductTitle>
            </ControlsContainer>
            {DEV_MODE && (
              <ControlsContainer>
                <EditingToolbar />
              </ControlsContainer>
            )}
            <ControlsContainer style={{ marginLeft: "auto" }}>
              {displayNavigationArrows && (
                <ButtonGroup>
                  {prev && (
                    <Tooltip content="Previous Challenge">
                      <IconButton
                        id="prevButton"
                        icon="chevron-left"
                        aria-label="Previous Challenge"
                        onClick={() => this.props.selectChallenge(prev.id)}
                      />
                    </Tooltip>
                  )}
                  {next && (
                    <Tooltip content="Next Challenge">
                      <IconButton
                        id="nextButton"
                        icon="chevron-right"
                        aria-label="Next Challenge"
                        onClick={() => this.props.selectChallenge(next.id)}
                      />
                    </Tooltip>
                  )}
                </ButtonGroup>
              )}
              {this.props.userAuthenticated && this.props.user ? (
                <AccountDropdownButton>
                  <div
                    id="account-menu-dropdown"
                    className="account-menu-dropdown"
                  >
                    <CreateAccountText className="account-menu">
                      Welcome, {this.props.user.profile.givenName}!
                    </CreateAccountText>
                    <div className="dropdown-links">
                      <Link
                        id="profile-link"
                        to="/profile"
                        style={{
                          borderBottom: `1px solid ${COLORS.BORDER_DROPDOWN_MENU_ITEM}`,
                        }}
                      >
                        Profile
                      </Link>
                      <Link
                        id="logout-link"
                        onClick={this.handleLogout}
                        to="/logout"
                      >
                        Logout
                      </Link>
                    </div>
                  </div>
                </AccountDropdownButton>
              ) : (
                <AccountButton
                  id="login-signup-button"
                  onClick={() => this.props.setSingleSignOnDialogState(true)}
                >
                  <CreateAccountText>Login or Signup</CreateAccountText>
                </AccountButton>
              )}
            </ControlsContainer>
          </Header>
          <Switch>
            <Route key={0} path="/workspace/:id" component={Workspace} />
            <Route key={1} path="/home" component={Home} />
            <Route key={2} path="/profile" component={Profile} />
            <Route
              key={3}
              path="/logout"
              component={() => <Redirect to="/home" />}
            />
            <Route key={4} component={() => <Redirect to="/workspace" />} />
          </Switch>
        </DarkTheme>
      </React.Fragment>
    );
  }

  handleLogout = () => {
    this.props.logoutUser();
  };

  renderLoadingOverlay = () => {
    return (
      <LoadingOverlay visible={this.props.workspaceLoading}>
        <MobileView />
        <div>
          <OverlayLoadingText>Initializing Workspace...</OverlayLoadingText>
        </div>
      </LoadingOverlay>
    );
  };
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const BORDER = 3;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;

  position: relative;
  padding-top: ${BORDER}px;
  padding-bottom: 0px;
  padding-left: 0px;
  padding-right: 0px;
  margin-bottom: 0;
  background: #212121;
  border-bottom: 1px solid #404040;

  height: ${HEADER_HEIGHT}px;
  width: calc(100vw - 48);

  &:after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: ${BORDER}px;
    background: ${COLORS.GRADIENT_GREEN};
  }
`;

const ProductTitle = styled.h1`
  margin: 0;
  color: "white";
  font-weight: 100;
  font-family: "Helvetica Neue", Lato, sans-serif;

  a,
  a:hover {
    color: white;
    text-decoration: none;
  }
`;

const ControlsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: row;
`;

const NavIconButton = styled(({ overlayVisible, ...rest }) => (
  <Button
    minimal
    large
    aria-label="Open navigation map"
    icon={overlayVisible ? "menu-closed" : "menu"}
    {...rest}
  />
))`
  appearance: none;
  background: transparent;
  border: none;
  outline: none;
  margin-left: 10px;

  .bp3-icon {
    color: white !important;
    transform: scale(1.3);
  }
`;

const LoadingOverlay = styled.div`
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  z-index: 999;
  position: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.95);
  visibility: ${(props: { visible: boolean }) =>
    props.visible ? "visible" : "hidden"};
`;

const OverlayLoadingText = styled.p`
  margin: 0;
  font-size: 42px;
  font-weight: 200;
  color: ${COLORS.PRIMARY_BLUE};
`;

const AccountButton = styled(ButtonCore)`
  height: ${HEADER_HEIGHT};
  color: ${COLORS.TEXT_TITLE};
  border-radius: 4px;

  :hover {
    cursor: pointer;
    color: ${COLORS.TEXT_HOVER};
    background: ${COLORS.BACKGROUND_ACCOUNT_BUTTON};
  }
`;

const CreateAccountText = styled.h1`
  margin-right: 12px;
  margin-left: 12px;
  font-size: 18px;
  font-weight: 200;
  font-family: Helvetica Neue, Lato, sans-serif;
`;

const AccountDropdownButton = styled.div`
  .account-menu-dropdown {
    position: relative;
    display: inline-block;
    color: ${COLORS.TEXT_TITLE};
  }

  .dropdown-links {
    z-index: 1;
    display: none;
    position: absolute;
    min-width: 180px;
    box-shadow: 8px 8px 16px 16px rgba(0, 0, 0, 0.3);
    background-color: ${COLORS.BACKGROUND_DROPDOWN_MENU};
  }

  .dropdown-links a {
    padding: 12px 16px;
    text-decoration: none;
    display: block;
    color: ${COLORS.TEXT_TITLE};
  }

  .dropdown-links a:hover {
    color: ${COLORS.PRIMARY_GREEN};
    background-color: ${COLORS.BACKGROUND_DROPDOWN_MENU_HOVER};
  }

  .account-menu-dropdown:hover .dropdown-links {
    display: block;
  }

  :hover {
    cursor: pointer;
    color: ${COLORS.TEXT_HOVER};
  }
`;

/** ===========================================================================
 * Mobile/Desktop Styles
 * ============================================================================
 */

const MobileView = () => (
  <MobileContainer>
    <MobileTitleText>Welcome to Pairwise</MobileTitleText>
    <MobileText>
      Unfortunately, smart phones and tablets are just not the best devices for
      developing software. Our platform is intended to be used on a larger
      screen device. Please return on a laptop or desktop!
    </MobileText>
    <MobileText>
      While you are here, feel free to{" "}
      <a target="__blank" href="https://www.pairwise.tech">
        visit our landing page
      </a>{" "}
      where you can learn more about the curriculum. Thank you!
    </MobileText>
  </MobileContainer>
);

const MobileContainer = styled.div`
  z-index: 5000;
  padding: 25px;
  display: flex;
  width: 100%;
  height: 100%;
  position: absolute;
  flex: 1;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  visibility: hidden;
  background: ${COLORS.BACKGROUND_BODY};

  a {
    color: ${COLORS.PRIMARY_GREEN};
  }

  @media (max-width: 768px) {
    visibility: visible;
  }
`;

const MobileText = styled.p`
  font-size: 16px;
  font-weight: 300;
  text-align: center;
  font-family: "Helvetica Neue", Lato, sans-serif;
  color: ${COLORS.TEXT_CONTENT};
`;

const MobileTitleText = styled(MobileText)`
  font-size: 24px;
  font-weight: 300;
  font-family: "Helvetica Neue", Lato, sans-serif;
  color: ${COLORS.TEXT_TITLE};
`;

interface DarkThemeProps {
  className?: string;
  children: React.ReactNode;
}
const DarkTheme = ({ className, ...props }: DarkThemeProps) => {
  return <div className={cx(className, Classes.DARK)} {...props} />;
};

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  user: Modules.selectors.user.userSelector(state),
  userAuthenticated: Modules.selectors.auth.userAuthenticated(state),
  challenge: Modules.selectors.challenges.firstUnfinishedChallenge(state),
  nextPrevChallenges: Modules.selectors.challenges.nextPrevChallenges(state),
  overlayVisible: Modules.selectors.challenges.navigationOverlayVisible(state),
  workspaceLoading: Modules.selectors.challenges.workspaceLoadingSelector(
    state,
  ),
});

const dispatchProps = {
  logoutUser: Modules.actions.app.logoutUser,
  selectChallenge: Modules.actions.challenges.setChallengeId,
  setNavigationMapState: Modules.actions.challenges.setNavigationMapState,
  setSingleSignOnDialogState: Modules.actions.auth.setSingleSignOnDialogState,
  initializeApp: Modules.actions.app.initializeApp,
  storeAccessToken: Modules.actions.auth.storeAccessToken,
  toggleScrollLock: Modules.actions.app.toggleScrollLock,
};

const mergeProps = (
  state: ReturnType<typeof mapStateToProps>,
  methods: typeof dispatchProps,
  props: {},
) => ({
  ...props,
  ...methods,
  ...state,
  toggleNavigationMap: () => {
    const { overlayVisible } = state;
    if (overlayVisible) {
      methods.toggleScrollLock({ locked: false });
    } else {
      methods.toggleScrollLock({ locked: true });
    }
    methods.setNavigationMapState(!overlayVisible);
  },
});

type IProps = ReturnType<typeof mergeProps>;

const withProps = connect(mapStateToProps, dispatchProps, mergeProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default withProps(ApplicationContainer);
