import * as ENV from "tools/admin-env";
import React from "react";
import { connect } from "react-redux";
import { useMedia } from "use-media";
import { Redirect, Route, Switch } from "react-router";
import styled from "styled-components/macro";
import Modules, { ReduxStoreState } from "modules/root";
import { Link } from "react-router-dom";
import { COLORS, DESKTOP, HEADER_HEIGHT, MOBILE } from "tools/constants";
import AdminStatsPage from "./AdminStatsPage";
import AdminIndex from "./AdminIndex";
import Swipy from "swipyjs";
import { Button, FocusStyleManager, Icon } from "@blueprintjs/core";
import {
  FullScreenOverlay,
  OverlayText,
  OverlaySmallText,
  PairwiseOpenCloseLogo,
  JSON_COMPONENT_ID,
} from "./AdminComponents";
import AdminNavigationMenu from "./AdminNavigationMenu";
import AdminKeyboardShortcuts from "./AdminKeyboardShortcuts";
import AdminUsersPage from "./AdminUsersPage";
import AdminPaymentsPage from "./AdminPaymentsPage";
import AdminFeedbackPage from "./AdminFeedbackPage";
import AdminSearchBox from "./AdminSearchBox";
import Hugh from "../icons/hugh.jpg";
import AdminSearchPage from "./AdminSearchPage";
import AdminChallengeDetailModal from "./AdminChallengeDetailModal";
import AdminPullRequestPage, {
  PULL_REQUEST_DIFF_VIEW_ID,
} from "./AdminPullRequestPage";
import { themeColor, themeText } from "./AdminThemeContainer";
import AdminChallengeAnalytics from "./AdminChallengeAnalyticsPage";
import AdminGrowthPage from "./AdminGrowthPage";

// Only show focus outline when tabbing around the UI
FocusStyleManager.onlyShowFocusOnTabs();

/** ===========================================================================
 * AdminContainer
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
const AdminContainer = (props: IProps) => {
  const {
    user,
    initialized,
    logoutUser,
    userLoading,
    overlayVisible,
    initializeApp,
    userAuthenticated,
    initializationError,
    setNavigationMapState,
  } = props;

  const isMobile = useMedia(MOBILE, false);
  const [hasHandledRedirect, setHasHandledRedirect] = React.useState(false);
  const [mobileAccountMenuOpen, setMobileAccountMenuState] =
    React.useState(false);

  const mobileToggleAccountDropdown = (state: "open" | "close") => {
    const className = "account-menu-dropdown-active";
    const dropdown = document.getElementById(ACCOUNT_MENU_DROPDOWN_CLASS);
    if (dropdown) {
      if (state === "open") {
        setMobileAccountMenuState(true);
        dropdown.classList.add(className);
      } else {
        setMobileAccountMenuState(false);
        dropdown.classList.remove(className);
      }
    }
  };

  React.useEffect(() => {
    const handleEvent = (event: MouseEvent) => {
      const shouldClose = shouldCloseMobileDropdownMenu(event);
      if (shouldClose) {
        setMobileAccountMenuState(false);
        mobileToggleAccountDropdown("close");
      }
    };

    window.addEventListener("click", handleEvent);
    return () => {
      window.removeEventListener("click", handleEvent);
    };
  });

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

  const ready = !initialized || userLoading;

  if (initializationError) {
    return <ErrorOverlay />;
  } else if (ready) {
    return <LoadingOverlay visible />;
  }

  const isLoggedIn = userAuthenticated && user.profile !== null;

  const authRoutes = [
    <Route key="stats" path="/stats" component={AdminStatsPage} />,
    <Route key="growth" path="/growth" component={AdminGrowthPage} />,
    <Route key="users" path="/users" component={AdminUsersPage} />,
    <Route key="payments" path="/payments" component={AdminPaymentsPage} />,
    <Route key="feedback" path="/feedback" component={AdminFeedbackPage} />,
    <Route key="search" path="/search/:query?" component={AdminSearchPage} />,
    <Route
      key="pull-requests"
      path="/pull-requests/:pull?"
      component={AdminPullRequestPage}
    />,
    <Route
      key="challenge-analytics"
      path="/challenge-analytics"
      component={AdminChallengeAnalytics}
    />,
    <Route key="redirect" component={() => <Redirect to="/stats" />} />,
  ];

  return (
    <React.Fragment>
      <NavigationSwipeHandler
        isMobile={isMobile}
        overlayVisible={overlayVisible}
        setNavigationMapState={setNavigationMapState}
      />
      <AdminNavigationMenu isMobile={isMobile} />
      <AdminChallengeDetailModal isMobile={isMobile} />
      <AdminKeyboardShortcuts />
      <Header>
        <ControlsContainer
          style={{
            height: "100%",
            marginRight: 0,
            width: isMobile ? "auto" : 350,
          }}
        >
          {isLoggedIn && (
            <>
              <NavIconButton
                overlayVisible={overlayVisible}
                onClick={() => setNavigationMapState(!overlayVisible)}
                style={{
                  color: "white",
                  marginRight: isMobile ? 15 : 20,
                }}
              />
              <ProductTitle id="product-title">
                <Link
                  to="/stats"
                  id="header-home-link"
                  style={{ display: "flex", alignItems: "center" }}
                >
                  Pairwise Admin
                </Link>
              </ProductTitle>
            </>
          )}
        </ControlsContainer>
        <ControlsContainer style={{ marginLeft: 0, width: "100%" }}>
          <>
            {isLoggedIn && <AdminSearchBox />}
            {userLoading ? (
              <p style={{ margin: 0, marginRight: 10 }}>Loading...</p>
            ) : isLoggedIn && user.profile ? (
              <AccountDropdownButton>
                <div
                  id={ACCOUNT_MENU_DROPDOWN_CLASS}
                  className={ACCOUNT_MENU_DROPDOWN_CLASS}
                >
                  <UserBio
                    onClick={() => {
                      if (mobileAccountMenuOpen) {
                        mobileToggleAccountDropdown("close");
                      } else {
                        mobileToggleAccountDropdown("open");
                      }
                    }}
                  >
                    <CreateAccountText className="account-menu">
                      {!user.profile.givenName
                        ? "Hi, Admin"
                        : `Hi, ${user.profile.givenName}!`}
                    </CreateAccountText>
                    <img
                      src={Hugh}
                      width={32}
                      height={32}
                      alt="Profile Avatar"
                      style={{ borderRadius: "50%" }}
                    />
                  </UserBio>
                  <div className="dropdown-links">
                    <Link
                      to="/logout"
                      id="logout-link"
                      onClick={() => {
                        mobileToggleAccountDropdown("close");
                        logoutUser();
                      }}
                    >
                      <Icon icon="log-out" style={{ marginRight: 10 }} />
                      Logout
                    </Link>
                  </div>
                </div>
              </AccountDropdownButton>
            ) : (
              <LoginSignupButton
                id="login-signup-button"
                onClick={() => {
                  // Trigger signin with auth url redirect
                  window.location.href = `${ENV.HOST}/auth/admin`;
                }}
              >
                Admin Login
              </LoginSignupButton>
            )}
          </>
        </ControlsContainer>
      </Header>
      <Switch>
        {isLoggedIn ? authRoutes : null}
        <Route exact key="index" path="/" component={AdminIndex} />
        <Route
          key="logout"
          path="/logout"
          component={() => <Redirect to="/" />}
        />
        <Route
          key="redirect"
          component={() => <Redirect to={isLoggedIn ? "/stats" : "/"} />}
        />
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
      <OverlayText id="pw-loading-overlay">
        Launching Pairwise Admin...
      </OverlayText>
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

const ACCOUNT_MENU_DROPDOWN_CLASS = "account-menu-dropdown";
const ACCOUNT_MENU_DROPDOWN_CLASS_CSS = ".account-menu-dropdown";

// Rather hideous way to cancel the hover effect on mobile...
const shouldCloseMobileDropdownMenu = (event: MouseEvent) => {
  try {
    if (event) {
      let node = event.target;
      while (node) {
        // @ts-ignore
        for (const className of node.classList) {
          if (className === ACCOUNT_MENU_DROPDOWN_CLASS) {
            return false;
          }
        }

        // @ts-ignore
        node = node.parentElement;
      }
    }

    return true;
  } catch (err) {
    // no op
  }
};

const BORDER = 2;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding-top: ${BORDER}px;
  padding-bottom: 0px;
  padding-left: 0px;
  padding-right: 0px;
  margin-bottom: 0;
  border-bottom: ${(props) => {
    const color = props.theme.dark ? COLORS.LIGHT_GREY : COLORS.LIGHT_BORDER;
    return `1px solid ${color}`;
  }};

  ${themeColor("background", "#212121", COLORS.WHITE)};

  height: ${HEADER_HEIGHT}px;
  width: calc(100vw - 48);

  &:after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: ${BORDER}px;
    background: ${COLORS.GRADIENT_PINK};
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
  font-weight: 100;
  font-family: "Helvetica Neue", Lato, sans-serif;

  ${themeText("white", "black")};

  a {
    ${themeText("white", "black")};
    text-decoration: none;
  }

  a:hover {
    color: ${COLORS.LIGHT_PINK};
  }

  /* Not vital to the product so hide it for thin views */
  @media ${MOBILE} {
    display: none;
  }
`;

const ControlsContainer = styled.div`
  display: flex;
  align-items: center;
  flex-direction: row;
  justify-content: flex-end;
`;

const NavIconButton = styled(({ overlayVisible, ...rest }) => (
  <Button
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
      filter: grayscale(${(props) => (props.overlayVisible ? 1 : 0)});
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
  ${themeText("white", "black")};
`;

const AccountDropdownButton = styled.div`
  margin-right: 4px;
  flex-shrink: 0;

  ${ACCOUNT_MENU_DROPDOWN_CLASS_CSS} {
    position: relative;
    display: inline-block;
    ${themeText(COLORS.TEXT_TITLE, COLORS.TEXT_LIGHT_THEME)};
  }

  .dropdown-links {
    z-index: 1000;
    display: none;
    position: absolute;
    right: 0;
    min-width: 215px;
    box-shadow: 8px 8px 16px 16px rgba(0, 0, 0, 0.3);
    ${themeColor(
      "background",
      COLORS.BACKGROUND_DROPDOWN_MENU,
      COLORS.BACKGROUND_MODAL_LIGHT,
    )};
  }

  .dropdown-links a {
    padding: 12px 16px;
    text-decoration: none;
    display: block;
    ${themeText(COLORS.TEXT_TITLE, COLORS.TEXT_LIGHT_THEME)};
  }

  .dropdown-links a:hover {
    ${themeText(COLORS.PRIMARY_GREEN)};

    ${themeColor(
      "background",
      COLORS.BACKGROUND_DROPDOWN_MENU_HOVER,
      COLORS.BACKGROUND_PAGE_LIGHT,
    )};
  }

  @media ${DESKTOP} {
    ${ACCOUNT_MENU_DROPDOWN_CLASS_CSS}:hover .dropdown-links {
      display: block;
    }
  }

  @media ${MOBILE} {
    ${ACCOUNT_MENU_DROPDOWN_CLASS_CSS}-active .dropdown-links {
      display: block;
    }
  }

  :hover {
    cursor: pointer;
    color: ${COLORS.TEXT_HOVER};
  }
`;

interface NavigationSwipeHandlerProps {
  isMobile: boolean;
  overlayVisible: boolean;
  setNavigationMapState: typeof Modules.actions.challenges.setNavigationMapState;
}

/**
 * HTML ids of various UI elements which need to have the swipe behavior
 * disabled. This UI elements tend to have horizontally overflowing content,
 * so the horizontal swipe needs to be able to scroll the content instead
 * of open the navigation menu.
 */
const swipeDismissElementIds = new Set([
  JSON_COMPONENT_ID,
  PULL_REQUEST_DIFF_VIEW_ID,
]);

/**
 * The navigation swipe handler component which handles detecting swipe
 * events on mobile and toggling the navigation side menu.
 */
const NavigationSwipeHandler = (props: NavigationSwipeHandlerProps) => {
  const { isMobile, overlayVisible, setNavigationMapState } = props;

  const isTouchEventOnEditor = (touchEvent: any) => {
    try {
      // For most browsers:
      if (touchEvent.path) {
        return !!touchEvent.path.find((x: HTMLElement) =>
          swipeDismissElementIds.has(x.id),
        );
      } else {
        // For Safari:
        let node = touchEvent.srcElement.parentNode;
        // document.parentNode is null so this should terminate eventually
        while (node) {
          if (swipeDismissElementIds.has(node.id)) {
            return true;
          } else {
            node = node.parentNode;
          }
        }
        return false;
      }
    } catch (err) {
      return false;
    }
  };

  /**
   * Add a gesture handler to toggle the navigation menu.
   */
  React.useEffect(() => {
    // Not available on desktop
    if (!isMobile) {
      return;
    }

    // Attach handler to the document
    const swipeHandler = new Swipy(document.documentElement);

    // Handle to swipe right
    swipeHandler.on("swiperight", (touchEvent: any) => {
      if (isTouchEventOnEditor(touchEvent)) {
        return;
      }

      if (!overlayVisible) {
        setNavigationMapState(true);
      }
    });

    // Handle to swipe left
    swipeHandler.on("swipeleft", (touchEvent: any) => {
      if (isTouchEventOnEditor(touchEvent)) {
        return;
      }

      if (overlayVisible) {
        setNavigationMapState(false);
      }
    });

    // Remove native event listeners on unmount
    return () => {
      swipeHandler.unbind();
    };
  });

  return null;
};

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  user: Modules.selectors.admin.adminUserSelector(state),
  userLoading: Modules.selectors.admin.loading(state),
  location: Modules.selectors.app.locationSelector(state),
  initialized: Modules.selectors.app.appSelector(state).initialized,
  userAuthenticated: Modules.selectors.auth.userAuthenticated(state),
  initializationError:
    Modules.selectors.app.appSelector(state).initializationError,
  overlayVisible: Modules.selectors.challenges.navigationOverlayVisible(state),
});

const dispatchProps = {
  logoutUser: Modules.actions.auth.logoutUser,
  initializeApp: Modules.actions.app.initializeApp,
  storeAccessToken: Modules.actions.auth.storeAccessToken,
  setNavigationMapState: Modules.actions.challenges.setNavigationMapState,
};

type IProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default withProps(AdminContainer);
