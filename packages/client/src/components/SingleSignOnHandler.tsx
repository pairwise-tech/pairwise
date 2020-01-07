import { Dialog } from "@blueprintjs/core";
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
import { COLORS } from "tools/constants";
import { composeWithProps } from "tools/utils";

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
        aria-labelledby="simple-modal-title"
        aria-describedby="simple-modal-description"
        isOpen={this.props.dialogOpen}
        onClose={() => this.setAccountModalState(false)}
      >
        <AccountModal>
          {this.props.loadingAuth ? (
            <TitleText>Processing Login...</TitleText>
          ) : (
            <React.Fragment>
              <TitleText>Login or Create an Account</TitleText>
              <SocialButtonsContainer>
                <FacebookLoginButton style={ssoButtonStyles}>
                  <LoginLink
                    id="facebook-login"
                    href={`${ENV.HOST}/auth/facebook`}
                  >
                    Login with Facebook
                  </LoginLink>
                </FacebookLoginButton>
                <GithubLoginButton style={ssoButtonStyles}>
                  <LoginLink id="github-login" href={`${ENV.HOST}/auth/github`}>
                    Login with GitHub
                  </LoginLink>
                </GithubLoginButton>
                <GoogleLoginButton style={ssoButtonStyles}>
                  <LoginLink id="google-login" href={`${ENV.HOST}/auth/google`}>
                    Login with Google
                  </LoginLink>
                </GoogleLoginButton>
              </SocialButtonsContainer>
              <SubText>Creating an account is free and easy.</SubText>
              <SubText>
                Your account will be used to save your progress as you work on
                the courses.
              </SubText>
            </React.Fragment>
          )}
        </AccountModal>
      </Dialog>
    );
  }

  setAccountModalState = (state: boolean) => {
    this.props.setSingleSignOnDialogState(state);
  };
}

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

const AccountModal = styled.div`
  width: 525px;
  padding: 32px;
  padding-top: 22px;
  left: 50%;
  top: 50%;
  outline: none;
  position: absolute;
  background: black;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  transform: translate(-50%, -50%);
  border-radius: 4px;
  border: 1px solid ${COLORS.BORDER_MODAL};
  background-color: ${COLORS.BACKGROUND_MODAL};
`;

const TitleText = styled.h1`
  margin-right: 12px;
  margin-left: 12px;
  font-size: 22px;
  font-weight: 200;
  color: ${COLORS.TEXT_TITLE};
  font-family: Helvetica Neue, Lato, sans-serif;
`;

const SubText = styled(TitleText)`
  font-size: 16px;
  margin-top: 12px;
  max-width: 350px;
  text-align: center;
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  loadingAuth: Modules.selectors.auth.loadingAuth(state),
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
