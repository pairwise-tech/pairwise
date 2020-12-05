import { Dialog, Classes } from "@blueprintjs/core";
import React from "react";
import { connect } from "react-redux";
import { GithubLoginButton, createButton } from "react-social-login-buttons";
import styled from "styled-components/macro";
import Modules, { ReduxStoreState } from "modules/root";
import * as ENV from "tools/client-env";
import { composeWithProps } from "tools/utils";
import { removeEphemeralPurchaseCourseId } from "tools/storage-utils";
import { ModalTitleText, ModalContainer } from "./Shared";
import { COLORS } from "tools/constants";
import { ReactComponent as googleSvgIcon } from "../icons/google-sso-icon.svg";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface IState {}

/** ===========================================================================
 * React Component
 * ----------------------------------------------------------------------------
 * - This component renders a modal which provides and handles SSO options
 * for the application. Facebook is currently supported, Google and GitHub
 * SSO can be added to this component in the future.
 * ============================================================================
 */

class SingleSignOnHandler extends React.Component<IProps, IState> {
  render(): JSX.Element {
    return (
      <Dialog
        className={Classes.DARK}
        isOpen={this.props.dialogOpen}
        aria-labelledby="sso-modal-title"
        aria-describedby="facebook-login github-login google-login"
        onClose={() => {
          removeEphemeralPurchaseCourseId();
          this.props.setSingleSignOnDialogState(false);
        }}
      >
        <AuthenticationForm />
      </Dialog>
    );
  }
}

class AuthenticationFormComponent extends React.Component<{}, {}> {
  render(): JSX.Element {
    return (
      <ModalContainer>
        <ModalTitleText id="sso-modal-title">Login</ModalTitleText>
        <SocialButtonsContainer>
          <LoginLink id="google-login" href={`${ENV.HOST}/auth/google`}>
            <GoogleLoginButton
              className="sso-button"
              style={{
                ...ssoButtonStyles,
                padding: 0,
                paddingBottom: 2,
              }}
            >
              <LoginButtonText style={{ marginLeft: 2 }}>
                Sign in with Google
              </LoginButtonText>
            </GoogleLoginButton>
          </LoginLink>
          <LoginLink id="github-login" href={`${ENV.HOST}/auth/github`}>
            <GithubLoginButton className="sso-button" style={ssoButtonStyles}>
              <LoginButtonText>Sign in with GitHub</LoginButtonText>
            </GithubLoginButton>
          </LoginLink>
        </SocialButtonsContainer>
      </ModalContainer>
    );
  }

  toggleEmailLoginForm = (emailLoginFormVisible: boolean) => {
    this.setState({ emailLoginFormVisible });
  };
}

// Connect AuthenticationForm
export const AuthenticationForm = AuthenticationFormComponent;

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const GOOGLE_BLUE = "rgb(57, 122, 242)";
const GOOGLE_BLUE_ACTIVE = "rgba(57, 122, 242, 0.5)"; // Not exact brand color...

const GoogleButtonConfig = {
  iconSize: "42px",
  icon: googleSvgIcon,
  style: { background: GOOGLE_BLUE },
  activeStyle: { background: GOOGLE_BLUE_ACTIVE },
};

const GoogleLoginButton = createButton(GoogleButtonConfig);

const ssoButtonStyles = {
  width: 235,
  height: 46,
  marginTop: 12,
  fontFamily: "Roboto-Medium",
};

const SocialButtonsContainer = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  margin-bottom: 12px;
`;

const LoginLink = styled.a`
  font-weight: 500;
  font-size: 14px;
  color: white;
  margin-left: 4px;
  text-decoration: none;
`;

const LoginButtonText = styled.p`
  margin: 0;
  margin-left: 8px;
  color: ${COLORS.TEXT_CONTENT_BRIGHT};
  font-family: "Roboto Medium", arial;
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  dialogOpen: Modules.selectors.auth.singleSignOnDialogState(state),
});

const dispatchProps = {
  setSingleSignOnDialogState: Modules.actions.auth.setSingleSignOnDialogState,
};

interface ComponentProps {}

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

interface IProps extends ComponentProps, ConnectProps {}

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default composeWithProps<ComponentProps>(withProps)(SingleSignOnHandler);
