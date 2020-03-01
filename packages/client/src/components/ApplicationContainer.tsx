import React, { Suspense } from "react";
import { connect } from "react-redux";
import { useMedia } from "use-media";
import { Redirect, Route, Switch } from "react-router";
import styled from "styled-components/macro";
import Modules, { ReduxStoreState } from "modules/root";
import { Link } from "react-router-dom";
import { CODEPRESS } from "tools/client-env";
import { COLORS, HEADER_HEIGHT, SANDBOX_ID } from "tools/constants";
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
} from "@blueprintjs/core";
import Account from "./Account";
import {
  ButtonCore,
  ProfileIcon,
  IconButton,
  SmoothScrollButton,
  FullScreenOverlay,
  OverlayText,
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

class ApplicationContainer extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    /**
     * NOTE: The hasHandledRedirect state is used to capture the first
     * route that renders the route, before react-router takes over and starts
     * performing redirects. This is required to capture the access token
     * after a login event, which is delivered to the app via a redirect url
     * parameter.
     */
    this.state = {
      hasHandledRedirect: false,
    };
  }

  componentDidMount() {
    // We have to pass location in here to correctly capture the original
    // url to send it to the epics before React Router takes over and starts
    // to redirect the app.
    this.props.initializeApp({ location: window.location });
    this.setState({ hasHandledRedirect: true });
  }

  render(): Nullable<JSX.Element> {
    if (!this.state.hasHandledRedirect) {
      return null;
    }

    const { location, challenge, overlayVisible } = this.props;

    if (!challenge) {
      return this.renderLoadingOverlay();
    }

    const isSandbox = challenge.id === SANDBOX_ID;
    const displayNavigationArrows = location.includes("workspace");

    return (
      <React.Fragment>
        <MobileView />
        <Modals />
        {this.renderLoadingOverlay()}
        {CODEPRESS && <AdminKeyboardShortcuts />}
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
          {CODEPRESS && (
            <ControlsContainer>
              <EditingToolbar />
            </ControlsContainer>
          )}
          <ControlsContainer style={{ marginLeft: "auto" }}>
            {this.props.showFeedbackButton && (
              <Tooltip content="Submit Feedback" position="bottom">
                <IconButton
                  icon="help"
                  aria-label="open/close feedback dialog"
                  onClick={this.props.toggleFeedbackDialogOpen}
                />
              </Tooltip>
            )}
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
                <PrevChallengeIconButton id={"prevButton"} />
                <NextChallengeIconButton id={"nextButton"} />
              </ButtonGroup>
            )}
            {this.props.userAuthenticated && this.props.user.profile ? (
              <AccountDropdownButton>
                <div
                  id="account-menu-dropdown"
                  className="account-menu-dropdown"
                >
                  <UserBio>
                    <CreateAccountText className="account-menu">
                      Welcome, {this.props.user.profile.givenName}!{" "}
                    </CreateAccountText>
                    <ProfileIcon avatar={this.props.user.profile.avatarUrl} />
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
                      to="/logout"
                      id="logout-link"
                      onClick={this.handleLogout}
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
        {this.showMediaAreaButton && (
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
  }

  get showMediaAreaButton() {
    if (this.props.challenge) {
      return (
        challengeRequiresWorkspace(this.props.challenge) &&
        (CODEPRESS || this.props.hasMediaContent)
      );
    }

    return false;
  }

  renderLoadingOverlay = () => {
    return (
      <FullScreenOverlay visible={this.props.workspaceLoading}>
        <div>
          <OverlayText>Launching Pairwise...</OverlayText>
        </div>
      </FullScreenOverlay>
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

const MobileView = () => {
  const [isOpen, setIsOpen] = React.useState<boolean>(true);
  const isMobile = useMedia("(max-width: 768px)", false);
  return (
    <Alert
      confirmButtonText="Okay"
      onClose={() => setIsOpen(false)}
      isOpen={isOpen && isMobile}
      className={Classes.DARK}
    >
      <MobileContainer>
        <MobileTitleText>Welcome to Pairwise!</MobileTitleText>
        <MobileText>
          Pairwise might not work on mobile! Feel free to use Pairwise on a
          phone or tablet but it might not fully work as expected. We recommend
          you use a computer. For some challenges a phone simply doesn't have
          the necessary software to complete the challenge.
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
