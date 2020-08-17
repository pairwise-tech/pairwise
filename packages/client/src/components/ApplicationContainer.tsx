import React, { Suspense } from "react";
import { connect } from "react-redux";
import { useMedia } from "use-media";
import { Redirect, Route, Switch, useHistory } from "react-router";
import styled from "styled-components/macro";
import Modules, { ReduxStoreState } from "modules/root";
import { Link } from "react-router-dom";
import { CODEPRESS } from "tools/client-env";
import { COLORS, SANDBOX_ID, MOBILE } from "tools/constants";
import { HEADER_HEIGHT } from "tools/dimensions";
import EditingToolbar from "./EditingToolbar";
import Home from "./Home";
import Swipy from "swipyjs";
import NavigationOverlay from "./NavigationOverlay";
import {
  Button,
  ButtonGroup,
  FocusStyleManager,
  Tooltip,
  Menu,
  MenuItem,
  MenuDivider,
  Position,
  Popover,
  Icon,
} from "@blueprintjs/core";
import Account from "./Account";
import {
  ProfileIcon,
  IconButton,
  SmoothScrollButton,
  FullScreenOverlay,
  OverlayText,
  LoadingInline,
  DesktopOnly,
} from "./Shared";
import SingleSignOnModal from "./SingleSignOnModal";
import FeedbackModal from "./FeedbackModal";
import Workspace, { MOBILE_SCROLL_PANEL_ID } from "./Workspace";
import { ChallengeTypeOption } from "./ChallengeTypeMenu";
import {
  PrevChallengeIconButton,
  NextChallengeIconButton,
} from "./ChallengeControls";
import PaymentCourseModal from "./PaymentIntentModal";
import { AdminKeyboardShortcuts } from "./WorkspaceComponents";
import PaymentSuccessModal from "./PaymentSuccessModal";
import { challengeRequiresWorkspace } from "tools/utils";
import SearchBox from "./SearchBox";
import { AuthenticationForm } from "components/SingleSignOnModal";
import { ShortcutKeysPopover } from "./KeyboardShortcuts";
import { CONTENT_AREA_ID } from "./MediaArea";
import OfficeHoursPopover from "./OfficeHoursPopover";
import { FEEDBACK_DIALOG_TYPES } from "modules/feedback/actions";
import { getChallengeSlug } from "@pairwise/common";

// Only show focus outline when tabbing around the UI
FocusStyleManager.onlyShowFocusOnTabs();

const LazyChallengeTypeMenu = React.lazy(() => import("./ChallengeTypeMenu"));

const Noop = () => null;

const ChatWidget = React.lazy(() => import("@papercups-io/chat-widget"));

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
    initialized,
    logoutUser,
    initializeApp,
    updateChallenge,
    overlayVisible,
    workspaceLoading,
    hasMediaContent,
    toggleNavigationMap,
    openFeedbackDialog,
    userAuthenticated,
    nextPrevChallenges,
    setNavigationMapState,
    setSingleSignOnDialogState,
  } = props;

  const [hasHandledRedirect, setHasHandledRedirect] = React.useState(false);
  const isMobile = useMedia(MOBILE, false);
  const history = useHistory();
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);
  const handleSearchFocus = React.useCallback(() => {
    setIsSearchFocused(true);
  }, [setIsSearchFocused]);
  const handleSearchBlur = React.useCallback(() => {
    setIsSearchFocused(false);
  }, [setIsSearchFocused]);

  React.useEffect(() => {
    // We have to pass location in here to correctly capture the original
    // url to send it to the epics before React Router takes over and starts
    // to redirect the app.
    initializeApp({ location: window.location });
    setHasHandledRedirect(true);
  }, [initializeApp]);

  /**
   * Add a gesture handler to toggle the navigation menu.
   */
  React.useEffect(() => {
    // Determine if a touch event came the code panel scroll area.
    const isTouchEventOnEditor = (path: HTMLElement[]) => {
      return !!path.find(x => x.id === MOBILE_SCROLL_PANEL_ID);
    };

    // Not available on desktop
    if (!isMobile) {
      return;
    }

    // Attach handler to the document
    const swipeHandler = new Swipy(document.documentElement);

    // Handle to swipe right
    swipeHandler.on("swiperight", (touchEvent: any) => {
      if (isTouchEventOnEditor(touchEvent.path)) {
        return;
      }

      if (!overlayVisible) {
        setNavigationMapState(true);
      }
    });

    // Handle to swipe left
    swipeHandler.on("swipeleft", (touchEvent: any) => {
      if (isTouchEventOnEditor(touchEvent.path)) {
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

  if (!hasHandledRedirect) {
    return null;
  }

  if (!initialized) {
    return <LoadingOverlay visible={workspaceLoading} />;
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
      {isLoggedIn && (
        <MenuItem
          icon="user"
          text="Account"
          onClick={() => {
            history.push("/account");
          }}
        />
      )}
      <MenuDivider />
      {isLoggedIn ? (
        <MenuItem
          icon="log-out"
          text="Log out..."
          onClick={() => {
            logoutUser();
            history.push("/logout");
          }}
        />
      ) : (
        <MenuItem
          icon="log-in"
          text="Login or Signup"
          onClick={() => setSingleSignOnDialogState(true)}
        />
      )}
    </Menu>
  );

  return (
    <React.Fragment>
      <Modals />
      <LoadingOverlay visible={workspaceLoading} />
      {CODEPRESS && <AdminKeyboardShortcuts />}
      <NavigationOverlay isMobile={isMobile} overlayVisible={overlayVisible} />
      <Header>
        <ControlsContainer
          style={{ height: "100%", marginRight: isMobile ? 0 : 40 }}
        >
          <NavIconButton
            overlayVisible={overlayVisible}
            style={{ color: "white", marginRight: isMobile ? 15 : 20 }}
            onClick={toggleNavigationMap}
          />
          <ProductTitle id="product-title">
            <Link
              to="/home"
              id="header-home-link"
              style={{ display: "flex", alignItems: "center" }}
            >
              Pairwise
            </Link>
            <CurrentlyInBeta />
          </ProductTitle>
        </ControlsContainer>
        {CODEPRESS && (
          <ControlsContainer style={{ flexShrink: 0 }}>
            <EditingToolbar />
          </ControlsContainer>
        )}
        <ControlsContainer style={{ marginLeft: "0", width: "100%" }}>
          <SearchBox onFocus={handleSearchFocus} onBlur={handleSearchBlur} />
          {/* A spacer div. Applying this style to the icon button throws off the tooltip positioning */}
          <div style={{ marginLeft: 10 }} />
          {!isMobile && <ShortcutKeysPopover />}
          {!isMobile && (
            <Tooltip
              usePortal={false}
              position="bottom"
              content="Submit Feedback"
            >
              <IconButton
                icon="comment"
                style={{ marginLeft: 6, padding: 0 }}
                aria-label="open the feedback dialog"
                onClick={openFeedbackDialog}
              />
            </Tooltip>
          )}
          {isSandbox && (
            <Suspense fallback={<LoadingInline />}>
              <LazyChallengeTypeMenu
                items={SANDBOX_TYPE_CHOICES}
                currentChallengeType={challenge?.type}
                onItemSelect={x => {
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
              <ButtonGroup style={{ marginLeft: 6 }}>
                <PrevChallengeIconButton id="prevButton" />
                <NextChallengeIconButton id="nextButton" />
              </ButtonGroup>
            </DesktopOnly>
          )}
          <OfficeHoursPopover />
          {!isMobile && (
            <Link style={{ color: "white" }} to={"/workspace/sandbox"}>
              <Button
                id="sandboxButton"
                disabled={isSandbox}
                style={{ marginLeft: 10 }}
              >
                Sandbox
              </Button>
            </Link>
          )}
          {isMobile && (
            <LastChildMargin style={{ flexShrink: 0 }}>
              <Popover
                content={mobileMenuItems}
                position={Position.BOTTOM_RIGHT}
              >
                <IconButton icon="more" />
              </Popover>
            </LastChildMargin>
          )}
          {/* user.profile is a redundant check... but now the types work */}
          {isMobile || isSearchFocused ? null : isLoggedIn && user.profile ? (
            <AccountDropdownButton>
              <div id="account-menu-dropdown" className="account-menu-dropdown">
                <UserBio>
                  <CreateAccountText className="account-menu">
                    {!user.profile.givenName
                      ? "Welcome!"
                      : `Welcome, ${user.profile.givenName}!`}
                  </CreateAccountText>
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
          ) : (
            <Button
              id="login-signup-button"
              style={{
                margin: "0 10px",
                border: "1px solid rgba(255, 255, 255, 0.23)",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
              onClick={() => setSingleSignOnDialogState(true)}
            >
              Login or Signup
            </Button>
          )}
        </ControlsContainer>
      </Header>
      {showMediaAreaButton && (
        <SmoothScrollButton
          icon="chevron-down"
          position="bottom"
          positionOffset={-20}
          scrollToId={CONTENT_AREA_ID}
          backgroundColor="rgba(29, 29, 29, 0.7)"
        />
      )}
      <Switch>
        <Route key="workspace" path="/workspace" component={Workspace} />
        <Route key="workspace" path="/workspace/:id" component={Workspace} />
        <Route key="home" path="/home" component={Home} />
        <Route key="account" path="/account" component={Account} />
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
      {/* We don't care about showing a loading state for this */}
      {process.env.REACT_APP_CI ? null : (
        <Suspense fallback={<Noop />}>
          <ChatWidget
            customer={
              user.profile
                ? {
                    // NOTE: These undefineds are just to pass the ChatWidget typing
                    name: user.profile.displayName || undefined,
                    email: user.profile.email || undefined,
                    external_id: user.profile.uuid || undefined,
                  }
                : undefined
            }
            title="Happy Coding"
            subtitle="Have any questions or comments? 😊"
            primaryColor="#00d084"
            greeting=""
            newMessagePlaceholder="Start typing..."
            accountId="77d5095f-15ca-41a5-b982-2c910fc30d45"
            baseUrl="https://app.papercups.io"
          />
        </Suspense>
      )}
    </React.Fragment>
  );
};

const LoadingOverlay = (props: { visible: boolean }) => (
  <FullScreenOverlay
    data-selector="full-screen-overlay"
    visible={props.visible}
  >
    <div>
      <OverlayText id="pw-loading-overlay">Launching Pairwise...</OverlayText>
    </div>
  </FullScreenOverlay>
);

/** ===========================================================================
 * Styles
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

const CurrentlyInBeta = styled.small`
  display: block;
  position: absolute;
  top: 18%;
  left: 100%;
  transform: translate(-50%, -50%) scale(0.7);
  font-weight: bold;
  letter-spacing: 1.2px;
  background: #d81b82;
  padding: 0px 6px;
  box-shadow: 0 0 20px rgb(0, 0, 0);
  border-radius: 100px;
  &:before {
    content: "BETA";
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
  justify-content: center;
  flex-direction: row;
`;

type OpenCloseLogoProps = { isOpen?: boolean } & React.SVGProps<SVGSVGElement>;

const OpenCloseLogo = ({ isOpen = false, ...props }: OpenCloseLogoProps) => {
  return (
    <svg
      width="24.44"
      height="20"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g fillRule="nonzero" fill="none" transform="scale(0.37)">
        <rect
          fill="#27C9DD"
          x="0"
          y="0"
          width={isOpen ? 50 : 12}
          height="8"
          rx="3.774"
        />
        <rect
          fill="#FFB85A"
          x="0"
          y="46"
          width={isOpen ? 50 : 15}
          height="8"
          rx="3.774"
        />
        <rect
          fill="#F3577A"
          x="0"
          y="16"
          width={isOpen ? 50 : 25}
          height="8"
          rx="3.774"
        />
        <rect
          fill="#F6FA88"
          x="0"
          y="31"
          width={isOpen ? 50 : 34}
          height="8"
          rx="3.774"
        />
        <rect
          fill="#F3577A"
          x={!isOpen ? 24 : 56}
          y="46"
          width={isOpen ? 10 : 42}
          height="8"
          rx="3.774"
        />
        <rect
          fill="#FFB85A"
          x={!isOpen ? 42 : 56}
          y="31"
          width={isOpen ? 10 : 24}
          height="8"
          rx="3.774"
        />
        <rect
          fill="#49F480"
          x={!isOpen ? 21 : 56}
          y="0"
          width={isOpen ? 10 : 45}
          height="8"
          rx="3.774"
        />
        <rect
          fill="#27C9DD"
          x={!isOpen ? 33 : 56}
          y="16"
          width={isOpen ? 10 : 33}
          height="8"
          rx="3.774"
        />
      </g>
    </svg>
  );
};

const NavIconButton = styled(({ overlayVisible, ...rest }) => (
  <Button
    minimal
    large
    id="navigation-menu-button"
    aria-label="Open navigation map"
    {...rest}
  >
    <OpenCloseLogo isOpen={overlayVisible} />
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
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  location: Modules.selectors.app.locationSelector(state),
  user: Modules.selectors.user.userSelector(state),
  initialized: Modules.selectors.app.appSelector(state).initialized,
  userAuthenticated: Modules.selectors.auth.userAuthenticated(state),
  challenge: Modules.selectors.challenges.getCurrentChallenge(state),
  overlayVisible: Modules.selectors.challenges.navigationOverlayVisible(state),
  feedbackDialogOpen: Modules.selectors.feedback.getFeedbackDialogOpen(state),
  hasMediaContent: Modules.selectors.challenges.getHasMediaContent(state),
  nextPrevChallenges: Modules.selectors.challenges.nextPrevChallenges(state),
  workspaceLoading: Modules.selectors.challenges.workspaceLoadingSelector(
    state,
  ),
});

const dispatchProps = {
  logoutUser: Modules.actions.auth.logoutUser,
  setNavigationMapState: Modules.actions.challenges.setNavigationMapState,
  setSingleSignOnDialogState: Modules.actions.auth.setSingleSignOnDialogState,
  initializeApp: Modules.actions.app.initializeApp,
  storeAccessToken: Modules.actions.auth.storeAccessToken,
  updateChallenge: Modules.actions.challenges.updateChallenge,
  setFeedbackDialogState: Modules.actions.feedback.setFeedbackDialogState,
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
