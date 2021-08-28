import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import { Alert, Classes, Button, Checkbox, Intent } from "@blueprintjs/core";
import Modules, { ReduxStoreState } from "modules/root";
import {
  PageContainer,
  Text,
  PageTitle,
  ProfileIcon,
  ExternalLink,
} from "./SharedComponents";
import { COLORS } from "tools/constants";
import { SSO, Payment, canDisconnectAccountRequest } from "@pairwise/common";
import {
  capitalize,
  formatDate,
  getGravatarUrlFromEmail,
  isUsingGravatar,
} from "tools/utils";
import { EMAIL_VERIFICATION_STATUS } from "modules/user/store";
import { themeColor } from "./ThemeContainer";
import { ConnectedAccountButtons } from "./SingleSignOnModal";
import toaster from "../tools/toast-utils";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface IState {
  sso: Nullable<SSO>;
  alert: "sso" | "email" | null;
  email: string;
  givenName: string;
  familyName: string;
  displayName: string;
  editMode: boolean;
  editedEmail: boolean;
  editAvatarUseGravatar: boolean;
}

/** ===========================================================================
 * Account
 * ============================================================================
 */

class Account extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.state = {
      sso: null,
      alert: null,
      email: "",
      givenName: "",
      familyName: "",
      displayName: "",
      editMode: false,
      editedEmail: false,
      editAvatarUseGravatar: false,
    };
  }

  componentDidUpdate(prevProps: IProps) {
    if (prevProps.user !== this.props.user) {
      this.handleDiscardChanges();
    }
  }

  render(): Nullable<JSX.Element> {
    const { sso, alert, editMode: edit } = this.state;
    const { user, skeletons, emailVerificationStatus } = this.props;

    const { payments, profile, settings } = user;
    if (!payments || !profile || !skeletons) {
      return null;
    }

    const avatarUrl = profile.avatarUrl;
    const usingGravatar = isUsingGravatar(avatarUrl);
    const isDark = settings.appTheme === "dark";

    return (
      <PageContainer>
        <Alert
          icon="info-sign"
          canEscapeKeyCancel
          canOutsideClickCancel
          isOpen={alert !== null}
          cancelButtonText="Cancel"
          intent={Intent.DANGER}
          onCancel={this.handleCancelAlert}
          onConfirm={this.handleConfirmAlert}
          className={isDark ? "bp3-dark" : ""}
          confirmButtonText={alert === "sso" ? "Disconnect Account" : "OK"}
        >
          {alert === "sso" ? (
            <p>
              This will disconnect your {sso ? capitalize(sso) : ""} from your
              Pairwise profile. To undo this action, you would have to log in
              again with the same account.
            </p>
          ) : (
            <p>
              To verify your email, logout and then login and choose "Sign in
              with Email".
            </p>
          )}
        </Alert>
        <PageTitle>Account</PageTitle>
        <ProfileIcon
          width={95}
          height={95}
          style={{ marginBottom: 12 }}
          avatar={profile.avatarUrl}
        />
        {edit && !usingGravatar ? (
          <div style={{ marginTop: 12, marginBottom: 24 }}>
            <Checkbox
              checked={this.state.editAvatarUseGravatar}
              label="Use Gravatar for my avatar icon."
              onChange={() =>
                this.setState({
                  editAvatarUseGravatar: !this.state.editAvatarUseGravatar,
                })
              }
            />
            <TextItem>
              This will set your avatar based on your email address.
            </TextItem>
            <TextItem>
              You will need to add an avatar icon with a Gravatar account.{" "}
              <ExternalLink link="https://en.gravatar.com/support/what-is-gravatar/">
                Learn more here
              </ExternalLink>
              .
            </TextItem>
          </div>
        ) : usingGravatar ? (
          <TextItem style={{ marginBottom: 24 }}>
            Profile is currently using Gravatar for the avatar icon.{" "}
            <ExternalLink link="https://en.gravatar.com/support/what-is-gravatar/">
              Learn more here
            </ExternalLink>
            .
          </TextItem>
        ) : null}
        <TextItem id="profile-given-name">
          <Bold>Given Name:</Bold> {!edit && profile.givenName}
        </TextItem>
        {edit && (
          <InputField
            type="text"
            id="edit-input-given-name"
            placeholder="Enter your given name"
            className={Classes.INPUT}
            value={this.state.givenName}
            onChange={(event) =>
              this.setState({
                givenName: event.target.value,
              })
            }
          />
        )}
        <TextItem id="profile-family-name">
          <Bold>Family Name:</Bold> {!edit && profile.familyName}
        </TextItem>
        {edit && (
          <InputField
            type="text"
            id="edit-input-family-name"
            placeholder="Enter your family name"
            className={Classes.INPUT}
            value={this.state.familyName}
            onChange={(event) =>
              this.setState({
                familyName: event.target.value,
              })
            }
          />
        )}
        <TextItem id="profile-display-name">
          <Bold>Display Name:</Bold> {!edit && profile.displayName}
        </TextItem>
        {edit && (
          <InputField
            type="text"
            id="edit-input-display-name"
            placeholder="Enter a display name"
            className={Classes.INPUT}
            value={this.state.displayName}
            onChange={(event) =>
              this.setState({
                displayName: event.target.value,
              })
            }
          />
        )}
        {emailVerificationStatus === EMAIL_VERIFICATION_STATUS.LOADING ? (
          <TextItem>* Processing request...</TextItem>
        ) : emailVerificationStatus === EMAIL_VERIFICATION_STATUS.SENT ? (
          <TextItem>
            * Verification link sent to:{" "}
            <span style={{ color: COLORS.PRIMARY_GREEN }}>
              {this.state.email}
            </span>
            . Please check your email and follow the instructions.
          </TextItem>
        ) : (
          <>
            <TextItem>
              <Bold>Email:</Bold>{" "}
              <span id="user-email">{!edit && profile.email}</span>
            </TextItem>
            {edit && (
              <InputField
                type="text"
                className={Classes.INPUT}
                onChange={(event) =>
                  this.setState({
                    editedEmail: true,
                    email: event.target.value,
                  })
                }
                value={this.state.email}
              />
            )}
            {!profile.email ? (
              <TextItem
                style={{ color: COLORS.SECONDARY_YELLOW, fontSize: 12 }}
              >
                • Please enter your email to receive course and product updates.
              </TextItem>
            ) : edit ? (
              <>
                <TextItem style={{ fontSize: 12 }}>
                  • To change your email you will need to verify the new email
                  address.
                </TextItem>
              </>
            ) : null}
          </>
        )}
        {edit ? (
          <Controls>
            <Button
              intent="primary"
              text="Save Profile"
              id="save-profile-button"
              onClick={this.handleSaveChanges}
              style={{ marginRight: 8, color: COLORS.TEXT_DARK }}
            />
            <Button text="Cancel" onClick={this.handleDiscardChanges} />
          </Controls>
        ) : (
          <Controls>
            <Button
              id="edit-profile-button"
              onClick={this.handleEditProfile}
              text="Edit Profile Information"
            />
          </Controls>
        )}
        <PageTitle style={{ marginTop: 24 }}>Connected Accounts</PageTitle>
        <ConnectedAccountButtons
          email={profile.email}
          google={profile.googleAccountId}
          github={profile.githubAccountId}
          facebook={profile.facebookAccountId}
          emailVerified={Boolean(profile.emailVerified)}
          onClickConnectedAccountHandler={this.onClickConnectedAccount}
        />
        {payments.length > 0 && (
          <>
            <PageTitle style={{ marginTop: 24 }}>Payments</PageTitle>
            <Text>
              These are your purchased courses. After purchasing a course, you
              will have lifetime access.
            </Text>
            {payments.map(this.renderPaymentDetails)}
          </>
        )}
        <PageTitle style={{ marginTop: 24 }}>Coaching Sessions</PageTitle>
        {profile.hasCoachingSession ? (
          <Text>You have a coaching session.</Text>
        ) : (
          <Text>You have no coaching sessions.</Text>
        )}
        <PageTitle style={{ marginTop: 24 }}>Questions</PageTitle>
        <Text>
          Feel free to reach out to <b>sean@pairwise.tech</b> if you want to
          contact someone directly.
        </Text>
      </PageContainer>
    );
  }

  renderPaymentDetails = (payment: Payment, index: number) => {
    return (
      <React.Fragment key={payment.courseId}>
        <PaymentTitle
          style={{ color: COLORS.SECONDARY_YELLOW }}
          id={`account-payment-details-${index}`}
        >
          {this.getCourseTitleFromId(payment.courseId)}
        </PaymentTitle>
        <PaymentDetail>• Duration: Lifetime Access.</PaymentDetail>
        <PaymentDetail>
          • Date Paid: {formatDate(payment.datePaid)}
        </PaymentDetail>
      </React.Fragment>
    );
  };

  getCourseTitleFromId = (id: string) => {
    const { skeletons } = this.props;
    if (!skeletons) {
      return id;
    } else {
      const course = skeletons.find((c) => c.id === id);
      if (course) {
        return course.title;
      }

      return id; /* Shouldn't happen but just fallback to the course id... */
    }
  };

  handleEditProfile = () => {
    const { profile } = this.props.user;
    if (profile) {
      // Reset email verification status to allow users to edit their
      // email again, if they wish
      this.props.setEmailVerificationStatus(EMAIL_VERIFICATION_STATUS.DEFAULT);
      this.setState({
        editMode: true,
        email: profile.email || "",
        givenName: profile.givenName,
        familyName: profile.familyName,
        displayName: profile.displayName,
      });
    }
  };

  handleSaveChanges = () => {
    const { editedEmail, editAvatarUseGravatar } = this.state;

    let avatarUrl = this.props.user.profile?.avatarUrl;
    const usingGravatar = isUsingGravatar(avatarUrl);

    const applyGravatar = usingGravatar || editAvatarUseGravatar;
    const email = this.state.email || this.props.user.profile?.email;

    /**
     * Update the avatar URL if the user changed their email and if they are
     * using Gravatar for their avatar icon.
     */
    if (email && applyGravatar) {
      avatarUrl = getGravatarUrlFromEmail(email);
    }

    const userDetails = {
      avatarUrl,
      givenName: this.state.givenName,
      familyName: this.state.familyName,
      displayName: this.state.displayName,
    };

    this.props.updateUser(userDetails);

    if (editedEmail && this.state.email !== this.props.user.profile?.email) {
      this.props.updateUserEmail(this.state.email);
    }

    this.setState({
      editMode: false,
      editedEmail: false,
    });
  };

  /**
   * Account click handler.
   */
  onClickConnectedAccount = (sso: SSO | "email") => {
    const profile = this.props.user.profile;

    // No op
    if (!profile) {
      return;
    }

    if (sso === "email") {
      if (!profile.emailVerified) {
        this.setState({ alert: "email" });
      }
    } else {
      if (canDisconnectAccountRequest(profile)) {
        this.setState({ sso, alert: "sso" });
      } else {
        toaster.warn(
          "You cannot disconnect all social accounts without a verified email.",
        );
      }
    }
  };

  handleDiscardChanges = () => {
    this.setState({ editMode: false });
  };

  handleCancelAlert = () => {
    this.setState({ alert: null });
  };

  handleConfirmAlert = () => {
    const { sso, alert } = this.state;
    if (alert === "sso") {
      if (sso) {
        this.props.disconnectAccount(sso);
      }
    }

    this.setState({ alert: null, sso: null });
  };
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const TextItem = styled(Text)`
  margin-top: 12px;
  ${themeColor("color", COLORS.TEXT_CONTENT_BRIGHT)};
`;

const PaymentTitle = styled(Text)`
  font-size: 22px;
  margin-top: 16px;
  font-weight: bold;
  color: ${COLORS.TEXT_CONTENT_BRIGHT};
`;

const PaymentDetail = styled(Text)`
  font-size: 12px;
  ${themeColor("color", COLORS.TEXT_CONTENT)};
`;

const Bold = styled.b`
  font-weight: bold;
  ${themeColor("color", COLORS.TEXT_CONTENT)};
`;

const InputField = styled.input`
  width: 200px;
  margin-top: 12px;

  ${themeColor("color", COLORS.TEXT_HOVER)};
  ${themeColor(
    "background",
    COLORS.BACKGROUND_CONSOLE_DARK,
    COLORS.BACKGROUND_CONSOLE_LIGHT,
  )};
`;

const Controls = styled.div`
  margin-top: 24px;
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  user: Modules.selectors.user.userSelector(state),
  skeletons: Modules.selectors.challenges.getCourseSkeletons(state),
  emailVerificationStatus:
    Modules.selectors.user.emailVerificationStatus(state),
});

const dispatchProps = {
  initializeApp: Modules.actions.app.initializeApp,
  updateUser: Modules.actions.user.updateUser,
  updateUserEmail: Modules.actions.user.updateUserEmail,
  disconnectAccount: Modules.actions.user.disconnectAccount,
  setEmailVerificationStatus: Modules.actions.user.setEmailVerificationStatus,
};

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

type IProps = ConnectProps;

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default withProps(Account);
