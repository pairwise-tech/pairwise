import { Icon, Dialog, Classes, Button } from "@blueprintjs/core";
import React from "react";
import { connect } from "react-redux";
import {
  createButton,
  FacebookLoginButton,
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

interface AuthenticationFormProps {}

interface AuthenticationFormState {
  email: string;
  emailLoginFormVisible: boolean;
}

export class AuthenticationForm extends React.Component<
  AuthenticationFormProps,
  AuthenticationFormState
> {
  constructor(props: AuthenticationFormProps) {
    super(props);

    this.state = {
      email: "",
      emailLoginFormVisible: false,
    };
  }

  render(): JSX.Element {
    const { emailLoginFormVisible } = this.state;
    return (
      <ModalContainer>
        <ModalTitleText id="sso-modal-title">
          {emailLoginFormVisible
            ? "Login with a Magic Link"
            : "Login or Create an Account"}
        </ModalTitleText>
        {emailLoginFormVisible ? (
          <SocialButtonsContainer>
            <ModalSubText>
              Enter your email and we will send you a magic link to login or
              create an account.
            </ModalSubText>
            <InputField
              type="text"
              className={Classes.INPUT}
              value={this.state.email}
              placeholder="Enter your email"
              style={{ width: 415 }}
              onChange={event => this.setState({ email: event.target.value })}
            />
            <EmailButtonsContainer>
              <Button
                icon={
                  <Icon
                    icon="chevron-left"
                    color={COLORS.TEXT_CONTENT_BRIGHT}
                  />
                }
                color={COLORS.TEXT_CONTENT_BRIGHT}
                id="toggle-email-login-form"
                onClick={() => this.toggleEmailLoginForm(false)}
              />
              <Button
                intent="success"
                id="email-login-button"
                text="Send me the link!"
                style={{ marginLeft: 8 }}
                onClick={this.handleLoginByEmail}
              />
            </EmailButtonsContainer>
          </SocialButtonsContainer>
        ) : (
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
            <LoginLink id="facebook-login" href={`${ENV.HOST}/auth/facebook`}>
              <FacebookLoginButton
                className="sso-button"
                style={ssoButtonStyles}
              >
                <LoginButtonText>Sign in with Facebook</LoginButtonText>
              </FacebookLoginButton>
            </LoginLink>
            <LoginLink id="github-login" href={`${ENV.HOST}/auth/github`}>
              <GithubLoginButton className="sso-button" style={ssoButtonStyles}>
                <LoginButtonText>Sign in with GitHub</LoginButtonText>
              </GithubLoginButton>
            </LoginLink>
            <Button
              icon={
                <Icon
                  iconSize={24}
                  icon="envelope"
                  color={COLORS.TEXT_CONTENT_BRIGHT}
                />
              }
              id="toggle-email-login-form"
              alignText="left"
              intent="success"
              onClick={() => this.toggleEmailLoginForm(true)}
              style={{
                ...ssoButtonStyles,
                paddingLeft: 14,
              }}
              text={
                <LoginButtonText style={{ marginLeft: 10 }}>
                  Sign in with Email
                </LoginButtonText>
              }
            />
          </SocialButtonsContainer>
        )}
        <ModalSubText>
          Create an account with one-click for free. Your account will be used
          to save your progress as you work on the courses.
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
  }

  handleLoginByEmail = () => {
    console.log("Login by email!");
  };

  toggleEmailLoginForm = (emailLoginFormVisible: boolean) => {
    this.setState({ emailLoginFormVisible });
  };
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const GoogleButtonConfig = {
  iconSize: "42px",
  icon: googleSvgIcon,
  style: { background: "rgb(57, 122, 242)" },
  activeStyle: { background: "rgba(57, 122, 242, 0.5)" },
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

const EmailButtonsContainer = styled.div`
  margin-top: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const InputField = styled.input`
  margin-top: 12px;
  width: 200px;
  color: ${COLORS.TEXT_HOVER} !important;
  background: ${COLORS.BACKGROUND_CONSOLE} !important;
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
