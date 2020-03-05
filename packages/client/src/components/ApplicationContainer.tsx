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
import NavigationOverlay from "./NavigationOverlay";
import {
  Button,
  ButtonGroup,
  FocusStyleManager,
  Tooltip,
  Alert,
  Classes,
  Menu,
  MenuItem,
  MenuDivider,
  Position,
  Popover,
  Icon,
} from "@blueprintjs/core";
import Account from "./Account";
import {
  ButtonCore,
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
import Workspace from "./Workspace";
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
    location,
    challenge,
    updateChallenge,
    overlayVisible,
    workspaceLoading,
    hasMediaContent,
    toggleNavigationMap,
    showFeedbackButton,
    toggleFeedbackDialogOpen,
    user,
    userAuthenticated,
    logoutUser,
    setSingleSignOnDialogState,
    initializeApp,
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

  if (!challenge) {
    return <LoadingOverlay visible={workspaceLoading} />;
  }

  const isSandbox = challenge.id === SANDBOX_ID;
  const displayNavigationArrows = location.includes("workspace");
  const isWorkspaceRequired = challengeRequiresWorkspace(challenge);
  const showMediaAreaButton =
    challenge && isWorkspaceRequired && (CODEPRESS || hasMediaContent);

  const isLoggedIn = userAuthenticated && user.profile !== null;

  const mobileMenuItems = (
    <Menu>
      <MenuItem
        icon="code"
        onClick={() => {
          history.push("/workspace/sandbox");
        }}
        text="Sandbox"
      />
      {showFeedbackButton && (
        <MenuItem
          icon="help"
          onClick={toggleFeedbackDialogOpen}
          text="Submit Feedback"
        />
      )}
      <MenuItem
        icon="user"
        text="Account"
        onClick={() => {
          history.push("/account");
        }}
      />
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
      <MobileView isWorkspace={isWorkspaceRequired} />
      <Modals />
      <LoadingOverlay visible={workspaceLoading} />
      {CODEPRESS && <AdminKeyboardShortcuts />}
      <NavigationOverlay overlayVisible={overlayVisible} />
      <Header>
        <ControlsContainer
          style={{ height: "100%", marginRight: isMobile ? 0 : 40 }}
        >
          <NavIconButton
            overlayVisible={overlayVisible}
            style={{ color: "white", marginRight: isMobile ? 15 : 40 }}
            onClick={toggleNavigationMap}
          />
          <ProductTitle id="product-title">
            <Link to="/home">Pairwise</Link>
          </ProductTitle>
        </ControlsContainer>
        {CODEPRESS && (
          <ControlsContainer style={{ flexShrink: 0 }}>
            <EditingToolbar />
          </ControlsContainer>
        )}
        <ControlsContainer style={{ marginLeft: "0", width: "100%" }}>
          <SearchBox />
          {!isMobile && showFeedbackButton && (
            <Tooltip content="Submit Feedback" position="bottom">
              <IconButton
                style={{ marginLeft: 20 }}
                icon="help"
                aria-label="open/close feedback dialog"
                onClick={toggleFeedbackDialogOpen}
              />
            </Tooltip>
          )}
          {isSandbox && (
            <Suspense fallback={<LoadingInline />}>
              <LazyChallengeTypeMenu
                items={SANDBOX_TYPE_CHOICES}
                currentChallengeType={challenge?.type}
                onItemSelect={x => {
                  updateChallenge({
                    id: challenge.id, // See NOTE
                    challenge: { type: x.value },
                  });
                }}
              />
            </Suspense>
          )}
          {!isMobile && (
            <Link style={{ color: "white" }} to={"/workspace/sandbox"}>
              <Button
                id="sandboxButton"
                disabled={isSandbox}
                style={{ margin: "0 10px", marginLeft: isSandbox ? 0 : 10 }}
              >
                Sandbox
              </Button>
            </Link>
          )}
          {displayNavigationArrows && (
            <DesktopOnly>
              <ButtonGroup>
                <PrevChallengeIconButton id={"prevButton"} />
                <NextChallengeIconButton id={"nextButton"} />
              </ButtonGroup>
            </DesktopOnly>
          )}
          {isMobile && (
            <div style={{ flexShrink: 0 }}>
              <Popover
                content={mobileMenuItems}
                position={Position.BOTTOM_RIGHT}
              >
                <Button style={{ marginRight: 20 }} text="•••" />
              </Popover>
            </div>
          )}
          {/* user.profile is a redundant check... but now the types work */}
          {isMobile ? null : isLoggedIn && user.profile ? (
            <AccountDropdownButton>
              <div id="account-menu-dropdown" className="account-menu-dropdown">
                <UserBio>
                  <CreateAccountText className="account-menu">
                    Welcome, {user.profile.givenName}!{" "}
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
            <AccountButton
              id="login-signup-button"
              onClick={() => setSingleSignOnDialogState(true)}
            >
              <CreateAccountText>Login or Signup</CreateAccountText>
            </AccountButton>
          )}
        </ControlsContainer>
      </Header>
      {showMediaAreaButton && (
        <SmoothScrollButton
          icon="chevron-down"
          position="bottom"
          positionOffset={-20}
          scrollToId="supplementary-content-container"
          backgroundColor="rgba(29, 29, 29, 0.7)"
        />
      )}
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
    </React.Fragment>
  );
};

const LoadingOverlay = (props: { visible: boolean }) => (
  <FullScreenOverlay visible={props.visible}>
    <div>
      <OverlayText>Launching Pairwise...</OverlayText>
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

  position: relative;
  padding-top: ${BORDER}px;
  padding-bottom: 0px;
  padding-left: 0px;
  padding-right: 0px;
  margin-bottom: 0;
  background: #212121;
  border-bottom: 1px solid ${COLORS.LIGHT_GREY};

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

  /* Not vital to the product so hide it for thin views */
  @media ${MOBILE} {
    display: none;
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

const AccountButton = styled(ButtonCore)`
  height: ${HEADER_HEIGHT + 2};
  color: ${COLORS.TEXT_TITLE};
  border-radius: 4px;
  margin-left: 2px;
  margin-right: 2px;
  flex-shrink: 0;

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
 * Mobile/Desktop Styles
 * ============================================================================
 */

export const MobileView = (props: { isWorkspace: boolean }) => {
  const [isOpen, setIsOpen] = React.useState<boolean>(true);
  const isMobile = useMedia(MOBILE, false);
  return (
    <Alert
      confirmButtonText="Okay"
      onClose={() => setIsOpen(false)}
      isOpen={isOpen && isMobile && props.isWorkspace}
      className={Classes.DARK}
    >
      <MobileContainer>
        <MobileTitleText>A quick heads up</MobileTitleText>
        <MobileText style={{ margin: 0 }}>{"⚠️"}</MobileText>
        <MobileText>
          <strong>The Workspace might not work on mobile!</strong>
        </MobileText>
        <MobileText style={{ margin: 0 }}>{"⚠️"}</MobileText>
        <MobileText>
          Feel free to use Pairwise on a phone or tablet but it might not fully
          work as expected. We recommend you use a computer. For some challenges
          <span style={{ textDecoration: "underline" }}>
            a mobile device simply doesn't have the necessary software to
            complete the challenge
          </span>
          .
        </MobileText>
        <MobileText>
          Unfortunately, smart phones and tablets are not the best devices for
          developing software.
        </MobileText>
        <MobileText>
          If you you're just wondering what Pairwise is about you can check out
          our hompage:
        </MobileText>
        <MobileText style={{ fontSize: 20 }}>
          <a target="__blank" href="https://www.pairwise.tech">
            Visit Product Page
          </a>
        </MobileText>
      </MobileContainer>
    </Alert>
  );
};

const MobileContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;

  a {
    color: ${COLORS.PRIMARY_GREEN};
  }
`;

const MobileText = styled.p`
  margin-top: 12px;
  font-size: 18px;
  font-weight: 300;
  text-align: center;
  font-family: "Helvetica Neue", Lato, sans-serif;
  letter-spacing: 1px;
`;

const MobileTitleText = styled(MobileText)`
  font-size: 32px;
  font-weight: 300;
  font-family: "Helvetica Neue", Lato, sans-serif;
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  location: Modules.selectors.app.locationSelector(state),
  user: Modules.selectors.user.userSelector(state),
  userAuthenticated: Modules.selectors.auth.userAuthenticated(state),
  challenge: Modules.selectors.challenges.getCurrentChallenge(state),
  overlayVisible: Modules.selectors.challenges.navigationOverlayVisible(state),
  feedbackDialogOpen: Modules.selectors.feedback.getFeedbackDialogOpen(state),
  showFeedbackButton: Modules.selectors.app.showFeedbackButton(state),
  hasMediaContent: Modules.selectors.challenges.getHasMediaContent(state),
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
  toggleFeedbackDialogOpen: () => {
    methods.setFeedbackDialogState(!state.feedbackDialogOpen);
  },
});

type IProps = ReturnType<typeof mergeProps>;

const withProps = connect(mapStateToProps, dispatchProps, mergeProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default withProps(ApplicationContainer);
