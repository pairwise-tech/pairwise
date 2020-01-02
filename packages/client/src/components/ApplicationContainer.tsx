import IconButton from "@material-ui/core/IconButton";
import Menu from "@material-ui/icons/Menu";
import queryString from "query-string";
import React from "react";
import { connect } from "react-redux";
import { Redirect, Route, Switch } from "react-router";
import styled from "styled-components/macro";

import SkipNext from "@material-ui/icons/SkipNext";
import SkipPrevious from "@material-ui/icons/SkipPrevious";
import Modules, { ReduxStoreState } from "modules/root";
import { DEV_MODE } from "tools/client-env";
import { COLORS, HEADER_HEIGHT } from "tools/constants";
import EditingToolbar from "./EditingToolbar";
import NavigationOverlay from "./NavigationOverlay";
import Profile from "./Profile";
import { StyledTooltip } from "./shared";
import SingleSignOnHandler, {
  CreateAccountText,
  CreateAccountTextClickable,
} from "./SingleSignOnHandler";
import Workspace from "./Workspace";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface IState {
  hasHandledRedirect: boolean;
}

/** ===========================================================================
 * App
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
        {this.renderLoadingOverlay()}
        <SingleSignOnHandler />
        <NavigationOverlay overlayVisible={overlayVisible} />
        <Header>
          <ControlsContainer style={{ height: "100%", marginRight: 60 }}>
            <NavIconButton
              style={{ color: "white", marginRight: 40 }}
              onClick={this.toggleNavigationMap}
            />
            <h1
              style={{
                fontWeight: 100,
                color: "white",
                fontFamily: `'Helvetica Neue', Lato, sans-serif`,
                margin: 0,
              }}
            >
              Prototype X
            </h1>
          </ControlsContainer>
          {DEV_MODE && (
            <ControlsContainer>
              <EditingToolbar />
            </ControlsContainer>
          )}
          <ControlsContainer style={{ marginLeft: "auto" }}>
            {displayNavigationArrows && (
              <React.Fragment>
                {prev && (
                  <StyledTooltip title="Previous Challenge">
                    <IconButton
                      style={{ color: "white" }}
                      aria-label="Previous Challenge"
                      onClick={() => this.props.selectChallenge(prev.id)}
                    >
                      <SkipPrevious />
                    </IconButton>
                  </StyledTooltip>
                )}
                {next && (
                  <StyledTooltip title="Next Challenge">
                    <IconButton
                      style={{ color: "white" }}
                      aria-label="Next Challenge"
                      onClick={() => this.props.selectChallenge(next.id)}
                    >
                      <SkipNext />
                    </IconButton>
                  </StyledTooltip>
                )}
              </React.Fragment>
            )}
            {this.props.userAuthenticated && this.props.user ? (
              <CreateAccountText>
                Welcome, {this.props.user.profile.givenName}!
              </CreateAccountText>
            ) : (
              <CreateAccountTextClickable
                onClick={() => this.props.setSingleSignOnDialogState(true)}
              >
                Login/Signup
              </CreateAccountTextClickable>
            )}
          </ControlsContainer>
        </Header>
        <Switch>
          <Route key={0} path="/workspace/:id" component={Workspace} />
          <Route key={1} path="/profile" component={Profile} />
          <Route key={2} component={() => <Redirect to="/workspace" />} />
        </Switch>
      </React.Fragment>
    );
  }

  renderLoadingOverlay = () => {
    return (
      <LoadingOverlay visible={this.props.workspaceLoading}>
        <OverlayLoadingText>Initializing Workspace...</OverlayLoadingText>
      </LoadingOverlay>
    );
  };

  toggleNavigationMap = () => {
    const { overlayVisible } = this.props;
    if (overlayVisible) {
      this.props.toggleScrollLock({ locked: false });
    } else {
      this.props.toggleScrollLock({ locked: true });
    }
    this.props.setNavigationMapState(!overlayVisible);
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

const ControlsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: row;
`;

const NavIconButton = styled(props => (
  <IconButton aria-label="Open navigaton map" {...props}>
    <Menu />
  </IconButton>
))`
  color: white;
  appearance: none;
  background: transparent;
  border: none;
  outline: none;
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
  selectChallenge: Modules.actions.challenges.setChallengeId,
  setNavigationMapState: Modules.actions.challenges.setNavigationMapState,
  setSingleSignOnDialogState: Modules.actions.auth.setSingleSignOnDialogState,
  initializeApp: Modules.actions.app.initializeApp,
  storeAccessToken: Modules.actions.auth.storeAccessToken,
  toggleScrollLock: Modules.actions.app.toggleScrollLock,
};

interface ComponentProps {}

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

interface IProps extends ComponentProps, ConnectProps {}

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default withProps(ApplicationContainer);
