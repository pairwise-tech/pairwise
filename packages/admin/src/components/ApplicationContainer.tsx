import React from "react";
import { connect } from "react-redux";
import { useMedia } from "use-media";
import { Redirect, Route, Switch, useHistory } from "react-router";
import styled from "styled-components/macro";
import Modules, { ReduxStoreState } from "modules/root";
import { Link } from "react-router-dom";
import { COLORS, SANDBOX_ID, MOBILE } from "tools/constants";
import { HEADER_HEIGHT } from "tools/dimensions";
import Home from "./Home";
import {
  Button,
  FocusStyleManager,
  Menu,
  MenuItem,
  MenuDivider,
  Position,
  Popover,
  Icon,
} from "@blueprintjs/core";
import {
  ProfileIcon,
  IconButton,
  FullScreenOverlay,
  OverlayText,
  OverlaySmallText,
  PairwiseOpenCloseLogo,
} from "./Shared";
import SingleSignOnModal, {
  AuthenticationForm,
} from "components/SingleSignOnModal";
import { getChallengeSlug } from "@pairwise/common";

// Only show focus outline when tabbing around the UI
FocusStyleManager.onlyShowFocusOnTabs();

/** ===========================================================================
 * ApplicationContainer
 * ----------------------------------------------------------------------------
 * This is the top level component which renders the overall app structure,
 * including the routing Switch to render all child routes.
 * ============================================================================
 */

/**
 * NOTE: The hasHandledRedirect state is used to capture the first
 * route that renders the route, before react-router takes over and starts
 * performing redirects. This is required to capture the access token
 * after a login event, which is delivered to the app via a redirect url
 * parameter.
 */
const ApplicationContainer = (props: IProps) => {
  const {
    user,
    location,
    challenge,
    initialized,
    logoutUser,
    userLoading,
    initializeApp,
    overlayVisible,
    workspaceLoading,
    userAuthenticated,
    nextPrevChallenges,
    initializationError,
    setSingleSignOnDialogState,
  } = props;

  const [hasHandledRedirect, setHasHandledRedirect] = React.useState(false);
  const isMobile = useMedia(MOBILE, false);
  const history = useHistory();

  React.useEffect(() => {
    // We have to pass location in here to correctly capture the original
    // url to send it to the epics before React Router takes over and starts
    // to redirect the app.
    initializeApp({ location: window.location });
    setHasHandledRedirect(true);
  }, [initializeApp]);

  if (!hasHandledRedirect) {
    return null;
  }

  if (initializationError) {
    return <ErrorOverlay />;
  } else if (!initialized) {
    return <LoadingOverlay visible={workspaceLoading} />;
  }

  const onWorkspaceRoute = location.includes("workspace");
  const isSandbox =
    !!challenge && challenge.id === SANDBOX_ID && onWorkspaceRoute;

  const isLoggedIn = userAuthenticated && user.profile !== null;

  const { prev, next } = nextPrevChallenges;

  const mobileMenuItems = (
    <Menu>
      <MenuItem
        disabled={!prev}
        icon="arrow-left"
        text="Previous Challenge"
        onClick={() => {
          if (prev) {
            const slug = getChallengeSlug(prev);
            history.push(`/workspace/${slug}`);
          }
        }}
      />
      <MenuItem
        disabled={!next}
        icon="arrow-right"
        text="Next Challenge"
        onClick={() => {
          if (next) {
            const slug = getChallengeSlug(next);
            history.push(`/workspace/${slug}`);
          }
        }}
      />
      <MenuDivider />
      <MenuItem
        icon="home"
        onClick={() => {
          history.push("/home");
        }}
        text="Home"
      />
    </Menu>
  );

  return (
    <React.Fragment>
      <LoadingOverlay visible={workspaceLoading} />
      <SingleSignOnModal />
      <Header>
        <ControlsContainer style={{ height: "100%", width: 350 }}>
          <NavIconButton
            overlayVisible={overlayVisible}
            style={{ color: "white", marginRight: 20 }}
            onClick={() => null}
          />
          <ProductTitle id="product-title">
            <Link
              to="/home"
              id="header-home-link"
              style={{ display: "flex", alignItems: "center" }}
            >
              Pairwise Admin
            </Link>
          </ProductTitle>
        </ControlsContainer>
        <ControlsContainer style={{ marginLeft: "0", width: "100%" }}>
          {/* A spacer div. Applying this style to the icon button throws off the tooltip positioning */}
          <div style={{ marginLeft: 10 }} />
          {isMobile && (
            <LastChildMargin
              style={{ flexShrink: 0, marginRight: isLoggedIn ? 6 : 0 }}
            >
              <Popover
                content={mobileMenuItems}
                position={Position.BOTTOM_RIGHT}
              >
                <IconButton icon="more" />
              </Popover>
            </LastChildMargin>
          )}
          {userLoading ? (
            <div style={{ width: 8 }} />
          ) : isLoggedIn && user.profile ? (
            <AccountDropdownButton>
              <div id="account-menu-dropdown" className="account-menu-dropdown">
                <UserBio>
                  {!isMobile && (
                    <CreateAccountText className="account-menu">
                      {!user.profile.givenName
                        ? "Welcome!"
                        : `Welcome, ${user.profile.givenName}!`}
                    </CreateAccountText>
                  )}
                  <ProfileIcon avatar={user.profile.avatarUrl} />
                </UserBio>
                <div className="dropdown-links">
                  <Link
                    id="account-link"
                    to="/account"
                    style={{
                      borderBottom: `1px solid ${COLORS.BORDER_DROPDOWN_MENU_ITEM}`,
                    }}
                  >
                    <Icon icon="user" style={{ marginRight: 10 }} />
                    Account
                  </Link>
                  <Link to="/logout" id="logout-link" onClick={logoutUser}>
                    <Icon icon="log-out" style={{ marginRight: 10 }} />
                    Logout
                  </Link>
                </div>
              </div>
            </AccountDropdownButton>
          ) : isSandbox && isMobile ? (
            <Button
              icon="user"
              id="login-signup-button"
              style={{
                margin: "0 10px",
                border: "1px solid rgba(255, 255, 255, 0.23)",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
              onClick={() => setSingleSignOnDialogState(true)}
            />
          ) : (
            <LoginSignupButton
              id="login-signup-button"
              onClick={() => setSingleSignOnDialogState(true)}
            >
              Admin Login
            </LoginSignupButton>
          )}
        </ControlsContainer>
      </Header>
      <Switch>
        <Route key="home" path="/home" component={Home} />
        <Route key="404" path="/404" component={LostPage} />
        {!isLoggedIn && (
          <Route
            key="authenticate"
            path="/authenticate"
            component={AuthenticationForm}
          />
        )}
        <Route
          key="login"
          path="/login"
          component={() => <Redirect to="/authenticate" />}
        />
        <Route
          key="logout"
          path="/logout"
          component={() => <Redirect to="/home" />}
        />
        <Route key={4} component={() => <Redirect to="/home" />} />
      </Switch>
    </React.Fragment>
  );
};

const LoadingOverlay = (props: { visible: boolean }) => (
  <FullScreenOverlay
    visible={props.visible}
    data-selector="full-screen-overlay"
  >
    <div>
      <OverlayText id="pw-loading-overlay">Launching Pairwise...</OverlayText>
    </div>
  </FullScreenOverlay>
);

const ErrorOverlay = () => (
  <FullScreenOverlay visible data-selector="full-screen-overlay">
    <div>
      <OverlayText error id="pw-loading-overlay">
        An error occurred when loading Pairwise...{" "}
        <span aria-label=":(" role="img">
          😓
        </span>
      </OverlayText>
      <OverlaySmallText>
        We apologize for the inconvenience! You can try to reload the page.
      </OverlaySmallText>
    </div>
  </FullScreenOverlay>
);

/** ===========================================================================
 * Styles & Utils
 * ============================================================================
 */

const BORDER = 2;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding-top: ${BORDER}px;
  padding-bottom: 0px;
  padding-left: 0px;
  padding-right: 0px;
  margin-bottom: 0;
  background: #212121;
  border-bottom: 1px solid ${COLORS.LIGHT_GREY};

  height: ${HEADER_HEIGHT}px;
  width: calc(100vw - 48);

  @media ${MOBILE} {
    position: absolute;
  }

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

// NOTE: CSS from https://codepen.io/alphardex/pen/vYEYGzp.
const LoginSignupButton = styled(Button)`
  position: relative;
  margin: 0 10px;
  flex-shrink: 0;
  white-space: nowrap;

  --border-width: 1px;
  border-radius: var(--border-width);

  &::after {
    position: absolute;
    content: "";
    top: calc(-1 * var(--border-width));
    left: calc(-1 * var(--border-width));
    z-index: -1;
    width: calc(100% + var(--border-width) * 2);
    height: calc(100% + var(--border-width) * 2);
    background: linear-gradient(
      60deg,
      hsl(224, 85%, 66%),
      hsl(269, 85%, 66%),
      hsl(347, 87%, 65%),
      hsl(359, 85%, 66%),
      hsl(62, 92%, 76%),
      hsl(89, 85%, 66%),
      hsl(139, 89%, 62%),
      hsl(187, 73%, 51%)
    );

    background-size: 300% 300%;
    background-position: 0 50%;
    border-radius: calc(2 * var(--border-width));
    animation: moveGradient 4s alternate infinite;
  }

  @keyframes moveGradient {
    50% {
      background-position: 100% 50%;
    }
  }
`;

const ProductTitle = styled.h1`
  position: relative;
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

  /* Not vital to the product so hide it for thin views */
  @media ${MOBILE} {
    display: none;
  }
`;

const LastChildMargin = styled.div`
  &:last-child {
    margin-right: 10px;
  }
`;

const ControlsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-direction: row;
`;

const NavIconButton = styled(({ overlayVisible, ...rest }) => (
  <Button
    minimal
    large
    id="navigation-menu-button"
    aria-label="Open navigation map"
    {...rest}
  >
    <PairwiseOpenCloseLogo isOpen={overlayVisible} />
  </Button>
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
  .bp3-button-text {
    display: flex;
  }

  // NOTE: The filter only works in firefox as far as I know but it looks cool
  // when it works. It grays out the first four rects
  rect {
    transition: all 0.2s ease;
    &:nth-child(-n + 4) {
      filter: grayscale(${props => (props.overlayVisible ? 1 : 0)});
    }
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
  white-space: nowrap;
  font-family: Helvetica Neue, Lato, sans-serif;
`;

const AccountDropdownButton = styled.div`
  flex-shrink: 0;

  .account-menu-dropdown {
    position: relative;
    display: inline-block;
    color: ${COLORS.TEXT_TITLE};
  }

  .dropdown-links {
    z-index: 1000;
    display: none;
    position: absolute;
    right: 0;
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

const LostPageContainer = styled.div`
  margin-top: 150px;
  padding: 50px;
  max-width: 650px;
  margin: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
`;

/**
 * A simple 404 UI.
 */
const LostPage = () => (
  <LostPageContainer style={{ marginTop: 150 }}>
    <h1>404: Page Not Found</h1>
    <p>
      In your journey to learn programming, you may often encountered this
      error, which is in fact an HTTP response status code. A response code of
      404 means the requested resource could not be found.
    </p>
    <p>
      But alas, this is not a Pairwise challenge! You are in fact lost, and this
      is a real 404 error. You must have visited a url which is wrong or does
      not exist.
    </p>
    <p>
      Please consider returning <Link to="/home">home</Link> to find your way
      again.
    </p>
  </LostPageContainer>
);

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  user: Modules.selectors.user.userSelector(state),
  userLoading: Modules.selectors.user.loading(state),
  location: Modules.selectors.app.locationSelector(state),
  screensaverVisible: Modules.selectors.app.screensaverVisible(state),
  initialized: Modules.selectors.app.appSelector(state).initialized,
  userAuthenticated: Modules.selectors.auth.userAuthenticated(state),
  challenge: Modules.selectors.challenges.getCurrentChallenge(state),
  overlayVisible: Modules.selectors.challenges.navigationOverlayVisible(state),
  hasMediaContent: Modules.selectors.challenges.getHasMediaContent(state),
  nextPrevChallenges: Modules.selectors.challenges.nextPrevChallenges(state),
  initializationError: Modules.selectors.app.appSelector(state)
    .initializationError,
  workspaceLoading: Modules.selectors.challenges.workspaceLoadingSelector(
    state,
  ),
});

const dispatchProps = {
  logoutUser: Modules.actions.auth.logoutUser,
  setScreensaverState: Modules.actions.app.setScreensaverState,
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
});

type IProps = ReturnType<typeof mergeProps>;

const withProps = connect(mapStateToProps, dispatchProps, mergeProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default withProps(ApplicationContainer);
