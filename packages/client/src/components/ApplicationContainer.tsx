import {
  Button,
  ButtonGroup,
  Classes,
  Tooltip,
  FocusStyleManager,
} from "@blueprintjs/core";
import cx from "classnames";
import queryString from "query-string";
import React, { Suspense } from "react";
import { connect } from "react-redux";
import { Redirect, Route, Switch } from "react-router";
import styled from "styled-components/macro";

import Modules, { ReduxStoreState } from "modules/root";
import { Link } from "react-router-dom";
import { DEV_MODE } from "tools/client-env";
import { COLORS, HEADER_HEIGHT, SANDBOX_ID } from "tools/constants";
import EditingToolbar from "./EditingToolbar";
import Home from "./Home";
import NavigationOverlay from "./NavigationOverlay";
import Account from "./Account";
import { ButtonCore, IconNavLink, ProfileIcon } from "./Shared";
import SingleSignOnHandler from "./SingleSignOnHandler";
import Workspace from "./Workspace";
import { ChallengeTypeOption } from "./ChallengeTypeMenu";

// Only show focus outline when tabbing around the UI
FocusStyleManager.onlyShowFocusOnTabs();

const LazyChallengeTypeMenu = React.lazy(() => import("./ChallengeTypeMenu"));

const SANDBOX_TYPE_CHOICES: ChallengeTypeOption[] = [
  { value: "markup", label: "HTML/CSS" },
  { value: "typescript", label: "TypeScript" },
  { value: "react", label: "React" },
];

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
    this.handleInitializeUserSession();
  }

  handleInitializeUserSession = () => {
    const { accessToken, accountCreated } = queryString.parse(
      window.location.search,
    );

    const created =
      typeof accountCreated === "string" ? JSON.parse(accountCreated) : false;

    if (typeof accessToken === "string" && Boolean(accessToken)) {
      /* Kind of sloppy: */
      console.log(`Login detected! Account created: ${accountCreated}`);

      this.props.storeAccessToken({
        accessToken,
        accountCreated: Boolean(created),
      });
    }

    this.setState({ hasHandledRedirect: true });
  };

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

    const isSandbox = challenge.id === SANDBOX_ID;

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
              {isSandbox && (
                <Suspense fallback={<p>Menu Loading...</p>}>
                  <LazyChallengeTypeMenu
                    items={SANDBOX_TYPE_CHOICES}
                    currentChallengeType={challenge?.type}
                    onItemSelect={x => {
                      this.props.updateChallenge({
                        id: challenge.id, // See NOTE
                        challenge: { type: x.value },
                      });
                    }}
                  />
                </Suspense>
              )}
              <Link style={{ color: "white" }} to={"/workspace/sandbox"}>
                <Button
                  id="sandboxButton"
                  disabled={isSandbox}
                  style={{ margin: "0 20px" }}
                >
                  Sandbox
                </Button>
              </Link>
              {displayNavigationArrows && (
                <ButtonGroup>
                  {prev && (
                    <Tooltip content="Previous Challenge">
                      <IconNavLink
                        id="prevButton"
                        icon="chevron-left"
                        aria-label="Previous Challenge"
                        to={`/workspace/${prev.id}`}
                      />
                    </Tooltip>
                  )}
                  {next && (
                    <Tooltip content="Next Challenge">
                      <IconNavLink
                        id="nextButton"
                        icon="chevron-right"
                        aria-label="Next Challenge"
                        to={`/workspace/${next.id}`}
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
                    <UserBio>
                      <CreateAccountText className="account-menu">
                        Welcome, {this.props.user.profile.givenName}!{" "}
                      </CreateAccountText>
                      <ProfileIcon
                        avatar={this.props.user.profile.profileImageUrl}
                      />
                    </UserBio>
                    <div className="dropdown-links">
                      <Link
                        id="account-link"
                        to="/account"
                        style={{
                          borderBottom: `1px solid ${COLORS.BORDER_DROPDOWN_MENU_ITEM}`,
                        }}
                      >
                        Account
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
            <Route key={2} path="/account" component={Account} />
            <Route
              key={3}
              path="/logout"
              component={() => <Redirect to="/home" />}
            />
            <Route key={4} component={() => <Redirect to="/home" />} />
          </Switch>
        </DarkTheme>
      </React.Fragment>
    );
  }

  renderLoadingOverlay = () => {
    return (
      <LoadingOverlay visible={this.props.workspaceLoading}>
        <MobileView />
        <div>
          <OverlayLoadingText>Launching Pairwise...</OverlayLoadingText>
        </div>
      </LoadingOverlay>
    );
  };

  private readonly handleLogout = () => {
    this.props.logoutUser();
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
  color: white;
  font-weight: 100;
  font-family: "Helvetica Neue", Lato, sans-serif;

  a {
    color: white;
    text-decoration: none;
  }

  a:hover {
    color: ${COLORS.PRIMARY_GREEN};
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
    id="navigation-menu-button"
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
  background: rgba(15, 15, 15, 0.92);
  visibility: ${(props: { visible: boolean }) =>
    props.visible ? "visible" : "hidden"};
`;

const OverlayLoadingText = styled.p`
  margin: 0;
  font-size: 42px;
  font-weight: 200;
  color: ${COLORS.PRIMARY_GREEN};
`;

const AccountButton = styled(ButtonCore)`
  height: ${HEADER_HEIGHT + 2};
  color: ${COLORS.TEXT_TITLE};
  border-radius: 4px;
  margin-left: 2px;
  margin-right: 2px;

  :hover {
    cursor: pointer;
    color: ${COLORS.PRIMARY_GREEN};
    background: ${COLORS.BACKGROUND_ACCOUNT_BUTTON};
  }
`;

const UserBio = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding-right: 8px;
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
    z-index: 1000;
    display: none;
    position: absolute;
    min-width: 215px;
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
    <MobileTitleText>Welcome to Pairwise!</MobileTitleText>
    <MobileText>
      Unfortunately, smart phones and tablets are not the best devices for
      developing software. Our platform is intended to be used on a larger
      screen device. Please return on a laptop or desktop!
    </MobileText>
    <MobileText>
      While you are here, feel free to visit our product page where you can
      learn more about the curriculum:
    </MobileText>
    <MobileText style={{ fontSize: 20 }}>
      <a target="__blank" href="https://www.pairwise.tech">
        Visit Product Page
      </a>
    </MobileText>
  </MobileContainer>
);

const MobileContainer = styled.div`
  z-index: 5000;
  padding-left: 30px;
  padding-right: 30px;
  margin-top: -35px; /* ? */
  width: 100vw;
  height: 100vh;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  position: absolute;
  flex: 1;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
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
  margin-top: 12px;
  font-size: 18px;
  font-weight: 300;
  text-align: center;
  font-family: "Helvetica Neue", Lato, sans-serif;
  color: ${COLORS.TEXT_CONTENT};
`;

const MobileTitleText = styled(MobileText)`
  font-size: 32px;
  font-weight: 300;
  font-family: "Helvetica Neue", Lato, sans-serif;
  color: ${COLORS.TEXT_TITLE};
`;

interface DarkThemeProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
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
  challenge: Modules.selectors.challenges.getCurrentChallenge(state),
  nextPrevChallenges: Modules.selectors.challenges.nextPrevChallenges(state),
  overlayVisible: Modules.selectors.challenges.navigationOverlayVisible(state),
  workspaceLoading: Modules.selectors.challenges.workspaceLoadingSelector(
    state,
  ),
});

const dispatchProps = {
  logoutUser: Modules.actions.app.logoutUser,
  setNavigationMapState: Modules.actions.challenges.setNavigationMapState,
  setSingleSignOnDialogState: Modules.actions.auth.setSingleSignOnDialogState,
  initializeApp: Modules.actions.app.initializeApp,
  storeAccessToken: Modules.actions.auth.storeAccessToken,
  updateChallenge: Modules.actions.challenges.updateChallenge,
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
    methods.setNavigationMapState(!state.overlayVisible);
  },
});

type IProps = ReturnType<typeof mergeProps>;

const withProps = connect(mapStateToProps, dispatchProps, mergeProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default withProps(ApplicationContainer);
