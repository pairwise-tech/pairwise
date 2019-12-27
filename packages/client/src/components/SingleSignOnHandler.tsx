import { Modal } from "@material-ui/core";
import React from "react";
import FacebookLogin from "react-facebook-login";
import GoogleLogin from "react-google-login";
import { connect } from "react-redux";
import { GithubLoginButton } from "react-social-login-buttons";
import styled from "styled-components";

import Modules, { ReduxStoreState } from "modules/root";
import { COLORS } from "tools/constants";
import ENV from "tools/env";
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
      <Modal
        aria-labelledby="simple-modal-title"
        aria-describedby="simple-modal-description"
        open={this.props.dialogOpen}
        onClose={() => this.setAccountModalState(false)}
      >
        <AccountModal>
          {this.props.loadingAuth ? (
            <CreateAccountText>Processing Login...</CreateAccountText>
          ) : (
            <React.Fragment>
              <CreateAccountText>Signin to Get Started</CreateAccountText>
              <SocialButtonsContainer>
                <FacebookLogin
                  appId={ENV.FACEBOOK_APP_ID}
                  callback={this.handleFacebookResponse}
                  cssClass="social-media-login-button facebook-social-login"
                />
                <GithubLoginButton
                  style={{ width: 235, height: 43, marginTop: 12 }}
                >
                  <LoginLink href={`${ENV.HOST}/auth/github`}>
                    Login with GitHub
                  </LoginLink>
                </GithubLoginButton>
                <GoogleLogin
                  buttonText="Login with Google"
                  clientId={ENV.GOOGLE_APP_ID}
                  onSuccess={() => console.log("handling response")}
                  onFailure={() => console.log("handling response")}
                  cookiePolicy="single_host_origin"
                  className="social-media-login-button google-social-login"
                />
              </SocialButtonsContainer>
              <SubText>
                Once you create an account all of your course progress will be
                saved in your account.
              </SubText>
            </React.Fragment>
          )}
        </AccountModal>
      </Modal>
    );
  }

  handleFacebookResponse = async (response: any) => {
    try {
      this.props.facebookLoginCallback(response);
    } catch (err) {
      this.props.facebookLoginFailure();
    }
  };

  setAccountModalState = (state: boolean) => {
    this.props.setSingleSignOnDialogState(state);
  };
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const SocialButtonsContainer = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
`;

const LoginLink = styled.a`
  font-weight: 500;
  font-size: 14px;
  color: white;
  text-decoration: none;
`;

const AccountModal = styled.div`
  width: 525px;
  padding: 32px;
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
  border-radius: 3px;
  border: 1px solid ${COLORS.BORDER_MODAL};
  background-color: ${COLORS.BACKGROUND_MODAL};
`;

export const CreateAccountText = styled.h1`
  margin-right: 12px;
  margin-left: 12px;
  font-size: 18px;
  font-weight: 200;
  color: ${COLORS.TEXT_TITLE};
  font-family: Helvetica Neue, Lato, sans-serif;
`;

const SubText = styled(CreateAccountText)`
  font-size: 16px;
  margin-top: 24px;
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
  facebookLoginCallback: Modules.actions.auth.facebookLogin,
  facebookLoginFailure: Modules.actions.auth.facebookLoginFailure,
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
