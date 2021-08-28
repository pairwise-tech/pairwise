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
import { capitalize, composeWithProps } from "tools/utils";
import { removeEphemeralPurchaseCourseId } from "tools/storage-utils";
import {
  ModalTitleText,
  ModalContainer,
  ModalSubText,
  ExternalLink,
} from "./SharedComponents";
import { COLORS, MOBILE } from "tools/constants";
import { ReactComponent as googleSvgIcon } from "../icons/google-sso-icon.svg";
import { IThemeProps, themeColor } from "./ThemeContainer";
import { AppTheme, SSO } from "@pairwise/common";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface IState {}

/** ===========================================================================
 * SingleSignOnHandler
 * ----------------------------------------------------------------------------
 * - This component renders a modal which provides and handles SSO options
 * for the application. Facebook is currently supported, Google and GitHub
 * SSO can be added to this component in the future.
 * ============================================================================
 */

class SingleSignOnHandler extends React.Component<IProps, IState> {
  render(): JSX.Element {
    const isDark = this.props.appTheme === "dark";
    return (
      <Dialog
        className={isDark ? Classes.DARK : ""}
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

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  appTheme: Modules.selectors.user.userSettings(state).appTheme,
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
 * Export SingleSignOnHandler
 * ============================================================================
 */

export default composeWithProps<ComponentProps>(withProps)(SingleSignOnHandler);

/** ===========================================================================
 * AuthenticationForm
 * ============================================================================
 */

interface AuthenticationFormProps {
  appTheme: AppTheme;
  emailRequestSent: boolean;
  loginEmailRequestLoading: boolean;
  dispatchLoginByEmailRequest: typeof Modules.actions.auth.loginByEmail;
}

interface AuthenticationFormState {
  email: string;
  emailLoginFormVisible: boolean;
}

class AuthenticationFormComponent extends React.Component<
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
    const { appTheme, emailRequestSent, loginEmailRequestLoading } = this.props;
    const isDark = appTheme === "dark";
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
              {emailRequestSent
                ? "Magic link sent! Please check your inbox and follow the instructions."
                : "Enter your email and we will send you a magic link to login or create an account."}
            </ModalSubText>
            <form
              onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                this.handleLoginByEmail();
              }}
            >
              <InputField
                autoFocus
                type="text"
                className={Classes.INPUT}
                placeholder="Enter your email"
                value={this.state.email}
                disabled={loginEmailRequestLoading}
                onChange={(event) =>
                  this.setState({ email: event.target.value })
                }
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
                  style={{ marginLeft: 8 }}
                  disabled={loginEmailRequestLoading}
                  onClick={this.handleLoginByEmail}
                  text={
                    emailRequestSent
                      ? "Resend Email"
                      : loginEmailRequestLoading
                      ? "Loading..."
                      : "Send me the link!"
                  }
                />
              </EmailButtonsContainer>
            </form>
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
                  color={isDark ? COLORS.TEXT_CONTENT_BRIGHT : ""}
                />
              }
              id="toggle-email-login-form"
              alignText="left"
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
          to save your progress as you work on the Pairwise course.
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
    const { email } = this.state;
    this.props.dispatchLoginByEmailRequest({ email });
  };

  toggleEmailLoginForm = (emailLoginFormVisible: boolean) => {
    this.setState({ emailLoginFormVisible });
  };
}

/** ===========================================================================
 * Export AuthenticationForm
 * ============================================================================
 */

export const AuthenticationForm = connect(
  (state: ReduxStoreState) => ({
    appTheme: Modules.selectors.user.userSettings(state).appTheme,
    emailRequestSent: Modules.selectors.auth.emailRequestSent(state),
    loginEmailRequestLoading:
      Modules.selectors.auth.loginEmailRequestLoading(state),
  }),
  {
    dispatchLoginByEmailRequest: Modules.actions.auth.loginByEmail,
  },
)(AuthenticationFormComponent);

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
  margin-left: 4px;
  text-decoration: none;
  ${themeColor("color", "white", "black")};
`;

const LoginButtonText = styled.p`
  margin: 0;
  margin-left: 8px;
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
  width: 300px;

  color: ${(props: IThemeProps) => {
    return props.theme.dark ? COLORS.TEXT_HOVER : undefined;
  }} !important;

  background: ${(props: IThemeProps) => {
    return props.theme.dark ? COLORS.BACKGROUND_CONSOLE_DARK : undefined;
  }} !important;

  @media ${MOBILE} {
    width: 250px !important;
  }
`;

/** ===========================================================================
 * Connected Accounts Components
 * ============================================================================
 */

export interface ConnectedAccountsProps {
  email: Nullable<string>;
  github: Nullable<string>;
  facebook: Nullable<string>;
  google: Nullable<string>;
  emailVerified: boolean;
  onClickConnectedAccountHandler: (sso: SSO | "email") => void;
}

export const ConnectedAccountButtons = (props: ConnectedAccountsProps) => {
  const {
    github,
    google,
    facebook,
    email,
    emailVerified,
    onClickConnectedAccountHandler,
  } = props;

  const NotConnected = (sso: SSO | "email") => {
    return (
      <NotConnectedAccount>
        <SsoTextDisabled>{capitalize(sso)} Not Connected</SsoTextDisabled>
      </NotConnectedAccount>
    );
  };

  return (
    <>
      <Text style={{ maxWidth: 500 }}>
        Your connected accounts are linked together by email. If you sign in
        with multiple providers, which all have the same email, they will all be
        associated with a single Pairwise account.
      </Text>
      {google ? (
        <GoogleLoginButton
          onClick={() => onClickConnectedAccountHandler("google")}
          className="sso-button"
          style={{
            ...ssoButtonStyles,
            padding: 0,
            paddingBottom: 2,
          }}
        >
          <LoginButtonText style={{ marginLeft: 2 }}>
            Google Connected
          </LoginButtonText>
        </GoogleLoginButton>
      ) : (
        NotConnected("google")
      )}
      {facebook ? (
        <FacebookLoginButton
          // @ts-ignore
          onClick={() => onClickConnectedAccountHandler("facebook")}
          className="sso-button"
          style={ssoButtonStyles}
        >
          <LoginButtonText>Facebook Connected</LoginButtonText>
        </FacebookLoginButton>
      ) : (
        NotConnected("facebook")
      )}
      {github ? (
        <GithubLoginButton
          // @ts-ignore
          onClick={() => onClickConnectedAccountHandler("github")}
          className="sso-button"
          style={ssoButtonStyles}
        >
          <LoginButtonText>GitHub Connected</LoginButtonText>
        </GithubLoginButton>
      ) : (
        NotConnected("github")
      )}
      {email ? (
        <ConnectedAccountEmail
          onClick={() => onClickConnectedAccountHandler("email")}
        >
          <IconBox>
            {emailVerified ? (
              <Icon icon="tick" color={COLORS.PRIMARY_GREEN} />
            ) : (
              <Icon icon="disable" color={COLORS.LIGHT_GREY} />
            )}
          </IconBox>
          <SsoText style={{ marginLeft: 4 }}>
            Email {emailVerified ? "" : "Not "}Verified
          </SsoText>
        </ConnectedAccountEmail>
      ) : (
        NotConnected("email")
      )}
    </>
  );
};

const NotConnectedAccount = styled.div`
  margin-top: 12px;
  margin-left: 4px;
  height: 46px;
  width: 235px;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  ${themeColor("background", "rgb(20, 20, 20)", "rgb(150,150,150)")}
`;

const ConnectedAccount = styled.div`
  margin-top: 12px;
  margin-left: 4px;
  height: 46px;
  width: 235px;
  border-radius: 2px;
  display: flex;
  flex-direction: row;
  align-items: center;
  ${themeColor("background", "rgb(50, 50, 50)", "rgb(150,150,150)")}
`;

const ConnectedAccountEmail = styled(ConnectedAccount)`
  &:hover {
    cursor: pointer;
    background: rgb(75, 75, 75);
  }
`;

const SsoText = styled.p`
  margin: 0;
  ${themeColor("color", COLORS.WHITE, COLORS.TEXT_DARK)}
`;

const SsoTextDisabled = styled.p`
  margin: 0;
  color: ${COLORS.LIGHT_GREY};
`;

const Text = styled.p`
  margin: 0;
`;

const IconBox = styled.div`
  width: 50px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
`;
