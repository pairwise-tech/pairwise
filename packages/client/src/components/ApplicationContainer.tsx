import React, { Suspense } from "react";
import { connect } from "react-redux";
import { useMedia } from "use-media";
import { Redirect, Route, Switch, useHistory } from "react-router";
import styled from "styled-components/macro";
import Modules, { ReduxStoreState } from "modules/root";
import { Link } from "react-router-dom";
import { CODEPRESS } from "tools/client-env";
import { COLORS, SANDBOX_ID, MOBILE, DESKTOP } from "tools/constants";
import { HEADER_HEIGHT } from "tools/dimensions";
import EditingToolbar from "./EditingToolbar";
import Home from "./Home";
import NavigationOverlay from "./NavigationOverlay";
import {
  Button,
  FocusStyleManager,
  Menu,
  MenuItem,
  MenuDivider,
  Position,
  Icon,
} from "@blueprintjs/core";
import { Popover2, Tooltip2 } from "@blueprintjs/popover2";
import Account from "./Account";
import {
  ProfileIcon,
  IconButton,
  SmoothScrollButton,
  FullScreenOverlay,
  OverlayText,
  LoadingInline,
  DesktopOnly,
  OverlaySmallText,
  PairwiseOpenCloseLogo,
} from "./SharedComponents";
import SingleSignOnModal from "./SingleSignOnModal";
import FeedbackModal from "./FeedbackModal";
import {
  PrevChallengeIconButton,
  NextChallengeIconButton,
} from "./ChallengeControls";
import PaymentCourseModal from "./PaymentIntentModal";
import { AdminKeyboardShortcuts } from "./WorkspaceComponents";
import PaymentSuccessModal from "./PaymentSuccessModal";
import { challengeRequiresWorkspace, SANDBOX_TYPE_CHOICES } from "tools/utils";
import SearchBox from "./SearchBox";
import { AuthenticationForm } from "components/SingleSignOnModal";
import { ShortcutKeysPopover } from "./KeyboardShortcuts";
import { CONTENT_AREA_ID } from "./MediaArea";
import PomodoroTimer from "./PomodoroTimer";
import { FEEDBACK_DIALOG_TYPES } from "modules/feedback/actions";
import { getChallengeSlug } from "@pairwise/common";
import GlobalKeyboardShortcuts from "./GlobalKeyboardShortcuts";
import PairwiseScreensaver from "./PairwiseScreensaver";
import NavigationSwipeHandler from "./MobileSwipeHandler";
import DeepLinkCodeStringAlert from "./DeepLinkCodeStringAlert";
import { IThemeProps, themeColor, themeText } from "./ThemeContainer";
import AdminDrawer from "./AdminDrawer";
import UserLeaderboard from "./UserLeaderboard";
import Portfolio from "./Portfolio";

// Only show focus outline when tabbing around the UI
FocusStyleManager.onlyShowFocusOnTabs();

const LazyChallengeTypeMenu = React.lazy(() => import("./ChallengeTypeMenu"));

/**
 * Lazy load the workspace. The workspace includes various code which
 * increases the bundle size dramatically, namely babel-standalone and other
 * libraries and type definition files which are provided to the workspace
 * code environment.
 */
const PairwiseWorkspace = React.lazy(() => import("./Workspace"));

// All the application modal components:
const Modals = () => (
  <>
    <SingleSignOnModal />
    <PaymentCourseModal />
    <PaymentSuccessModal />
    <FeedbackModal />
  </>
);

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
    logoutUser,
    isEditMode,
    initialized,
    isUserAdmin,
    userLoading,
    initializeApp,
    overlayVisible,
    updateChallenge,
    hasMediaContent,
    workspaceLoading,
    userAuthenticated,
    isAdminDrawerOpen,
    accessTokenExists,
    updateUserSettings,
    openFeedbackDialog,
    nextPrevChallenges,
    screensaverVisible,
    setScreensaverState,
    toggleNavigationMap,
    setAdminDrawerState,
    initializationError,
    adminPullRequestId,
    setNavigationMapState,
    pullRequestDataPresent,
    setSingleSignOnDialogState,
  } = props;

  const adminPullRequestBadgeVisible = isUserAdmin && pullRequestDataPresent;
  const [hasHandledRedirect, setHasHandledRedirect] = React.useState(false);
  const [mobileAccountMenuOpen, setMobileAccountMenuState] =
    React.useState(false);
  const isMobile = useMedia(MOBILE, false);
  const history = useHistory();
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);
  const handleSearchFocus = React.useCallback(() => {
    setIsSearchFocused(true);
  }, [setIsSearchFocused]);
  const handleSearchBlur = React.useCallback(() => {
    setIsSearchFocused(false);
  }, [setIsSearchFocused]);

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

  if (initializationError) {
    return (
      <ErrorOverlay
        logoutUser={logoutUser}
        accessTokenExists={accessTokenExists}
      />
    );
  } else if (!initialized) {
    return <LoadingOverlay visible={workspaceLoading} />;
  } else if (screensaverVisible) {
    return <PairwiseScreensaver setScreensaverState={setScreensaverState} />;
  }

  const onWorkspaceRoute = location.includes("workspace");
  const isSandbox =
    !!challenge && challenge.id === SANDBOX_ID && onWorkspaceRoute;
  const displayNavigationArrows = onWorkspaceRoute;
  const isWorkspaceRequired = challengeRequiresWorkspace(challenge);
  const showMediaAreaButton =
    displayNavigationArrows &&
    challenge &&
    isWorkspaceRequired &&
    (CODEPRESS || hasMediaContent);

  const isLoggedIn = userAuthenticated && user.profile !== null;
  const isDark = user.settings.appTheme === "dark";

  // Check if... any course is under the PREMIUM plan
  const IS_PREMIUM =
    user.payments && user.payments.some((x) => x.plan === "PREMIUM");

  const { prev, next } = nextPrevChallenges;

  const toggleAppTheme = () => {
    updateUserSettings({
      appTheme: isDark ? "light" : "dark",
    });
  };

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
      <MenuItem
        icon="code"
        onClick={() => {
          history.push("/workspace/sandbox");
        }}
        text="Sandbox"
      />
      <MenuItem
        icon="help"
        onClick={openFeedbackDialog}
        text="Submit Feedback"
      />
      <MenuItem
        icon="lightbulb"
        onClick={toggleAppTheme}
        text={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
      />
      <MenuItem
        icon={<Icon icon="video" color={COLORS.YOUTUBE_RED} />}
        text="Pairwise on YouTube"
        onClick={() => {
          const url =
            "https://www.youtube.com/channel/UCG52QHurjYWfqFBQR_60EUQ";
          window.open(url, "_blank")?.focus();
        }}
      />
    </Menu>
  );

  return (
    <React.Fragment>
      <Modals />
      <AdminDrawer isMobile={isMobile} />
      <DeepLinkCodeStringAlert />
      <LoadingOverlay visible={workspaceLoading} />
      <GlobalKeyboardShortcuts />
      {CODEPRESS && <AdminKeyboardShortcuts />}
      <NavigationSwipeHandler
        isMobile={isMobile}
        overlayVisible={overlayVisible}
        setNavigationMapState={setNavigationMapState}
      />
      <NavigationOverlay isMobile={isMobile} />
      <Header isAdmin={isUserAdmin}>
        <ControlsContainer
          style={{ height: "100%", marginRight: isMobile ? 0 : 40 }}
        >
          <NavIconButton
            theme={user.settings.appTheme}
            overlayVisible={overlayVisible}
            onClick={toggleNavigationMap}
            style={{ color: "white", marginRight: isMobile ? 15 : 20 }}
          />
          <Tooltip2
            usePortal={false}
            position="right"
            content={
              <p style={{ margin: 0 }}>
                During <b>beta</b> the Pairwise course content remains in
                development and may change.
              </p>
            }
          >
            <ProductTitle id="product-title">
              <Link
                to="/home"
                id="header-home-link"
                style={{ display: "flex", alignItems: "center" }}
              >
                Pairwise
              </Link>
              <BetaLabel />
            </ProductTitle>
          </Tooltip2>
        </ControlsContainer>
        {CODEPRESS && (
          <ControlsContainer style={{ flexShrink: 0 }}>
            <EditingToolbar />
          </ControlsContainer>
        )}
        <ControlsContainer style={{ marginLeft: "0", width: "100%" }}>
          {(!isSandbox || !isMobile) && !isEditMode ? (
            <SearchBox onFocus={handleSearchFocus} onBlur={handleSearchBlur} />
          ) : (
            <SearchBoxFiller />
          )}
          {adminPullRequestBadgeVisible && !isMobile && (
            <Tooltip2
              usePortal={false}
              position="bottom"
              content="Open in GitHub"
            >
              <Button
                icon="git-pull"
                style={{
                  width: 225,
                  color: COLORS.TEXT_DARK,
                  background: COLORS.SECONDARY_YELLOW,
                }}
                onClick={() => {
                  const url = `https://github.com/pairwise-tech/pairwise/pull/${adminPullRequestId}`;
                  window.open(url, "_blank")?.focus();
                }}
              >
                Viewing Pull Request {adminPullRequestId}
              </Button>
            </Tooltip2>
          )}
          {/* A spacer div. Applying this style to the icon button throws off the tooltip positioning */}
          <div style={{ marginLeft: 10 }} />
          {!isMobile && <PomodoroTimer />}
          {!isMobile && (
            <Tooltip2
              usePortal={false}
              position="bottom"
              content="Submit Feedback"
            >
              <IconButton
                icon="comment"
                style={{ padding: 0 }}
                aria-label="Open the feedback dialog"
                onClick={openFeedbackDialog}
              />
            </Tooltip2>
          )}
          {!isMobile && <ShortcutKeysPopover />}
          {!isMobile && (
            <Tooltip2
              usePortal={false}
              position="bottom"
              content={
                isDark ? "Switch to Light Theme" : "Switch to Dark Theme"
              }
            >
              <IconButton
                icon="lightbulb"
                style={{ padding: 0 }}
                aria-label="Toggle App Theme"
                onClick={() =>
                  updateUserSettings({
                    appTheme: isDark ? "light" : "dark",
                  })
                }
              />
            </Tooltip2>
          )}
          {isUserAdmin && (
            <Tooltip2
              disabled={isMobile}
              usePortal={false}
              position="bottom"
              openOnTargetFocus={false}
              content="Toggle Admin Drawer"
            >
              <IconButton
                icon="shield"
                style={{ padding: 0 }}
                color={COLORS.SECONDARY_PINK}
                hover_color={COLORS.RED}
                aria-label="Toggle the admin drawer"
                onClick={() =>
                  setAdminDrawerState({ isOpen: !isAdminDrawerOpen })
                }
              />
            </Tooltip2>
          )}
          {!isMobile && (
            <Tooltip2
              usePortal={false}
              position="bottom"
              content="Subscribe to Pairwise on YouTube"
            >
              <IconButton
                icon="video"
                style={{ padding: 0 }}
                color={COLORS.YOUTUBE_RED}
                hover_color={COLORS.YOUTUBE_RED}
                aria-label="View Pairwise on YouTube"
                onClick={() => {
                  const url =
                    "https://www.youtube.com/channel/UCG52QHurjYWfqFBQR_60EUQ";
                  window.open(url, "_blank")?.focus();
                }}
              />
            </Tooltip2>
          )}
          {/* {!isMobile && (
            <Tooltip2
              usePortal={false}
              position="bottom"
              content="Launch Pairwise Screensaver"
            >
              <IconButton
                icon="media"
                style={{ padding: 0 }}
                aria-label="Start the Pairwise Screensaver"
                onClick={() => setScreensaverState(true)}
              />
            </Tooltip2>
          )} */}
          {/* <PairwiseLivePopover /> */}
          {isSandbox && (
            <Suspense fallback={<LoadingInline />}>
              <LazyChallengeTypeMenu
                items={SANDBOX_TYPE_CHOICES}
                currentChallengeType={challenge?.type}
                onItemSelect={(x) => {
                  if (challenge) {
                    updateChallenge({
                      id: challenge.id, // See NOTE
                      challenge: { type: x.value },
                    });
                  }
                }}
              />
            </Suspense>
          )}
          {displayNavigationArrows && (
            <DesktopOnly>
              <NextPrevButtons>
                <PrevChallengeIconButton id="prevButton" />
                <NextChallengeIconButton id="nextButton" />
              </NextPrevButtons>
            </DesktopOnly>
          )}
          {!isMobile && (
            <Tooltip2
              usePortal={false}
              position="bottom"
              content="Open Sandbox Scratchpad"
            >
              <Link style={{ color: "white" }} to={"/workspace/sandbox"}>
                <Button
                  id="sandboxButton"
                  disabled={isSandbox}
                  style={{ marginLeft: 9 }}
                >
                  Sandbox
                </Button>
              </Link>
            </Tooltip2>
          )}
          {isMobile && (
            <LastChildMargin
              style={{ flexShrink: 0, marginRight: isLoggedIn ? 6 : 0 }}
            >
              <Popover2
                content={mobileMenuItems}
                position={Position.BOTTOM_RIGHT}
              >
                <IconButton icon="more" />
              </Popover2>
            </LastChildMargin>
          )}
          {(isSearchFocused && isMobile) || userLoading ? (
            <div style={{ width: 8 }} />
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
                  {!isMobile && (
                    <CreateAccountText className="account-menu">
                      {!user.profile.givenName
                        ? "Welcome!"
                        : `Welcome, ${user.profile.givenName}!`}
                    </CreateAccountText>
                  )}
                  <ProfileIcon avatar={user.profile.avatarUrl} />
                  {isUserAdmin && !isMobile && <AdminBadge />}
                  {IS_PREMIUM && <PremiumBadge />}
                </UserBio>
                <div className="dropdown-links">
                  <Link
                    id="account-link"
                    to="/account"
                    onClick={() => mobileToggleAccountDropdown("close")}
                  >
                    <Icon
                      style={{ marginRight: 10 }}
                      icon={isUserAdmin ? "shield" : "user"}
                    />
                    My Account{isUserAdmin ? " (Admin)" : ""}
                  </Link>
                  <Link
                    id="portfolio-link"
                    to="/portfolio"
                    onClick={() => mobileToggleAccountDropdown("close")}
                  >
                    <Icon icon="box" style={{ marginRight: 10 }} />
                    Portfolio
                  </Link>
                  <Link
                    id="leaderboard-link"
                    to="/leaderboard"
                    onClick={() => mobileToggleAccountDropdown("close")}
                  >
                    <Icon
                      icon="horizontal-bar-chart-asc"
                      style={{ marginRight: 10 }}
                    />
                    Leaderboard
                  </Link>
                  <Link
                    id="pairwise-about-link"
                    target="__blank"
                    to={{ pathname: "https://www.pairwise.tech/" }}
                    onClick={() => mobileToggleAccountDropdown("close")}
                    style={{
                      borderBottom: `1px solid ${
                        user.settings.appTheme === "dark"
                          ? COLORS.BORDER_DROPDOWN_MENU_ITEM
                          : COLORS.LIGHT_BORDER
                      }`,
                    }}
                  >
                    <Icon icon="info-sign" style={{ marginRight: 10 }} />
                    About Pairwise
                  </Link>
                  <Link
                    to="/logout"
                    id="logout-link"
                    onClick={() => {
                      mobileToggleAccountDropdown("close");
                      logoutUser({});
                    }}
                  >
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
                flexShrink: 0,
                margin: "0 10px",
                whiteSpace: "nowrap",
                border: "1px solid rgba(255, 255, 255, 0.23)",
              }}
              onClick={() => setSingleSignOnDialogState(true)}
            />
          ) : (
            <LoginSignupButton
              id="login-signup-button"
              onClick={() => setSingleSignOnDialogState(true)}
            >
              Login or Signup
            </LoginSignupButton>
          )}
        </ControlsContainer>
      </Header>
      {showMediaAreaButton && (
        <SmoothScrollButton
          icon="chevron-down"
          position="bottom"
          positionOffset={-20}
          scrollToId={CONTENT_AREA_ID}
        />
      )}
      <Suspense fallback={<LoadingInline />}>
        <Switch>
          <Route
            key="workspace"
            path="/workspace"
            component={PairwiseWorkspace}
          />
          <Route
            key="workspace"
            path="/workspace/:id"
            component={PairwiseWorkspace}
          />
          <Route key="home" path="/home" component={Home} />
          <Route key="404" path="/404" component={LostPage} />
          <Route key="account" path="/account" component={Account} />
          {isLoggedIn && (
            <Route
              key="leaderboard"
              path="/leaderboard"
              component={UserLeaderboard}
            />
          )}
          {isLoggedIn && (
            <Route key="portfolio" path="/portfolio" component={Portfolio} />
          )}
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
            key="sign-up"
            path="/sign-up"
            component={() => <Redirect to="/authenticate" />}
          />
          <Route
            key="logout"
            path="/logout"
            component={() => <Redirect to="/home" />}
          />
          <Route key={4} component={() => <Redirect to="/home" />} />
        </Switch>
      </Suspense>
    </React.Fragment>
  );
};

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

const Header = styled.div<{ isAdmin: boolean }>`
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

  border-bottom: ${(props: IThemeProps) => {
    const color = props.theme.dark ? COLORS.LIGHT_GREY : COLORS.LIGHT_BORDER;
    return `1px solid ${color}`;
  }};

  ${themeColor("background", "#212121", "rgb(245,245,245)")};

  height: ${HEADER_HEIGHT}px;
  width: calc(100vw - 48);

  &:after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: ${BORDER}px;
    background: ${(props) => {
      return props.isAdmin ? COLORS.GRADIENT_PINK : COLORS.GRADIENT_GREEN;
    }};
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

const BetaLabel = styled.small`
  top: 18%;
  left: 100%;
  display: block;
  padding: 0px 6px;
  font-weight: bold;
  position: absolute;
  border-radius: 100px;
  letter-spacing: 1.2px;
  box-shadow: 0 0 20px rgb(0, 0, 0);
  background: ${COLORS.BETA_LABEL};
  transform: translate(-50%, -50%) scale(0.7);

  &:before {
    content: "BETA";
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
  justify-content: center;
  flex-direction: row;
`;

const LoadingOverlay = (props: { visible: boolean }) => (
  <FullScreenOverlay
    visible={props.visible}
    data-selector="full-screen-overlay"
  >
    <div />
  </FullScreenOverlay>
);

const ErrorOverlay = (props: {
  accessTokenExists: boolean;
  logoutUser: typeof Modules.actions.auth.logoutUser;
}) => (
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
      <Centered>
        {props.accessTokenExists && (
          <Button
            text="Logout"
            onClick={() => props.logoutUser({ shouldReloadPage: true })}
          />
        )}
      </Centered>
    </div>
  </FullScreenOverlay>
);

const Centered = styled.div`
  margin-top: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const NavIconButton = styled(({ overlayVisible, theme, ...rest }) => (
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
`;

const AccountDropdownButton = styled.div`
  flex-shrink: 0;

  ${ACCOUNT_MENU_DROPDOWN_CLASS_CSS} {
    position: relative;
    display: inline-block;
    ${themeText(COLORS.TEXT_TITLE, COLORS.TEXT_LIGHT_THEME)};
  }

  .dropdown-links {
    right: 0;
    z-index: 1000;
    display: none;
    position: absolute;
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
    ${themeText(COLORS.TEXT_HOVER)};
  }
`;

const NextPrevButtons = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 9px;
`;

const AdminBadge = styled.div`
  top: -3%;
  left: 22%;
  display: block;
  padding: 0px 6px;
  font-weight: bold;
  position: absolute;
  border-radius: 100px;
  letter-spacing: 1.2px;
  box-shadow: 0 0 20px rgb(0, 0, 0);
  background: ${COLORS.RED};
  transform: translate(2%, 2%) scale(0.6);

  &:before {
    content: "ADMIN USER";
  }
`;

const PremiumBadge = styled.div`
  top: -3%;
  right: 15%;
  display: block;
  padding: 0px 6px;
  font-weight: bold;
  position: absolute;
  border-radius: 100px;
  letter-spacing: 1.2px;
  box-shadow: 0 0 20px rgb(0, 0, 0);
  color: black;
  background: ${COLORS.PRIMARY_GREEN};
  transform: translate(2%, 2%) scale(0.6);

  &:before {
    content: "PREMIUM";
  }
`;

const AdminPullRequestViewBadge = styled.div`
  width: 250px;
  height: 25px;
  background: ${COLORS.SECONDARY_YELLOW};
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

const SearchBoxFiller = styled.div`
  position: relative;
  flex: 1 100%;
  width: auto;
  margin-left: 9px;
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  user: Modules.selectors.user.userSelector(state),
  userLoading: Modules.selectors.user.loading(state),
  isUserAdmin: Modules.selectors.auth.isUserAdmin(state),
  isEditMode: Modules.selectors.challenges.isEditMode(state),
  accessTokenExists: Modules.selectors.auth.accessTokenExists(state),
  isAdminDrawerOpen: Modules.selectors.app.isAdminDrawerOpen(state),
  adminPullRequestId: Modules.selectors.app.adminPullRequestId(state),
  pullRequestDataPresent:
    Modules.selectors.challenges.pullRequestDataPresent(state),
  location: Modules.selectors.app.locationSelector(state),
  screensaverVisible: Modules.selectors.app.screensaverVisible(state),
  initialized: Modules.selectors.app.appSelector(state).initialized,
  userAuthenticated: Modules.selectors.auth.userAuthenticated(state),
  challenge: Modules.selectors.challenges.getCurrentChallenge(state),
  overlayVisible: Modules.selectors.challenges.navigationOverlayVisible(state),
  feedbackDialogOpen: Modules.selectors.feedback.getFeedbackDialogOpen(state),
  hasMediaContent: Modules.selectors.challenges.getHasMediaContent(state),
  nextPrevChallenges: Modules.selectors.challenges.nextPrevChallenges(state),
  initializationError:
    Modules.selectors.app.appSelector(state).initializationError,
  workspaceLoading:
    Modules.selectors.challenges.workspaceLoadingSelector(state),
});

const dispatchProps = {
  logoutUser: Modules.actions.auth.logoutUser,
  setScreensaverState: Modules.actions.app.setScreensaverState,
  updateUserSettings: Modules.actions.user.updateUserSettings,
  setNavigationMapState: Modules.actions.challenges.setNavigationMapState,
  setSingleSignOnDialogState: Modules.actions.auth.setSingleSignOnDialogState,
  initializeApp: Modules.actions.app.initializeApp,
  storeAccessToken: Modules.actions.auth.storeAccessToken,
  updateChallenge: Modules.actions.challenges.updateChallenge,
  setFeedbackDialogState: Modules.actions.feedback.setFeedbackDialogState,
  setAdminDrawerState: Modules.actions.app.setAdminDrawerState,
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
  openFeedbackDialog: () => {
    const { pathname } = window.location;
    methods.setFeedbackDialogState(
      pathname.includes("workspace") && !pathname.includes("sandbox")
        ? FEEDBACK_DIALOG_TYPES.CHALLENGE_FEEDBACK
        : FEEDBACK_DIALOG_TYPES.ASK_A_QUESTION,
    );
  },
});

type IProps = ReturnType<typeof mergeProps>;

const withProps = connect(mapStateToProps, dispatchProps, mergeProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default withProps(ApplicationContainer);
