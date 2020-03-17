import { Dialog, Classes } from "@blueprintjs/core";
import React from "react";
import { connect } from "react-redux";
import {
  FacebookLoginButton,
  GoogleLoginButton,
  GithubLoginButton,
} from "react-social-login-buttons";
import styled from "styled-components/macro";
import Modules, { ReduxStoreState } from "modules/root";
import * as ENV from "tools/client-env";
import { composeWithProps } from "tools/utils";
import { removeEphemeralPurchaseCourseId } from "tools/storage-utils";
import {
  ModalTitleText,
  ModalContainer,
  ModalSubText,
  ExternalLink,
} from "./Shared";

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

export const AuthenticationForm = () => {
  return (
    <ModalContainer>
      <ModalTitleText id="sso-modal-title">
        Login or Create an Account
      </ModalTitleText>
      <SocialButtonsContainer>
        <LoginLink id="facebook-login" href={`${ENV.HOST}/auth/facebook`}>
          <FacebookLoginButton className="sso-button" style={ssoButtonStyles}>
            Login with Facebook
          </FacebookLoginButton>
        </LoginLink>
        <LoginLink id="github-login" href={`${ENV.HOST}/auth/github`}>
          <GithubLoginButton className="sso-button" style={ssoButtonStyles}>
            Login with GitHub
          </GithubLoginButton>
        </LoginLink>
        <LoginLink id="google-login" href={`${ENV.HOST}/auth/google`}>
          <GoogleLoginButton className="sso-button" style={ssoButtonStyles}>
            Login with Google
          </GoogleLoginButton>
        </LoginLink>
      </SocialButtonsContainer>
      <ModalSubText>
        Create an account with one-click for free. Your account will be used to
        save your progress as you work on the courses.
      </ModalSubText>
      <ModalSubText>
        By creating a Pairwise account you are agreeing to our{" "}
        <ExternalLink link="https://pairwise.tech/terms/">
          Terms of Service
        </ExternalLink>{" "}
        and{" "}
        <ExternalLink link="https://pairwise.tech/privacy-policy">
          Privacy Policy
        </ExternalLink>
        .
      </ModalSubText>
    </ModalContainer>
  );
};

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const ssoButtonStyles = { width: 235, height: 43, marginTop: 12 };

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
