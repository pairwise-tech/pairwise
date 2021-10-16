import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import {
  Alert,
  Classes,
  Button,
  Checkbox,
  Intent,
  Switch,
} from "@blueprintjs/core";
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
import SEO from "./SEO";

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
  username: string;
  editMode: boolean;
  editedEmail: boolean;
  showDeleteUserAlert: boolean;
  userDeletionTextConfirmation: string;
  editAvatarUseGravatar: boolean;
  accountDeletionProcessing: boolean;
}

const DELETE_CONFIRMATION_TEXT = "Please delete me";

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
      username: "",
      editMode: false,
      editedEmail: false,
      showDeleteUserAlert: false,
      editAvatarUseGravatar: false,
      userDeletionTextConfirmation: "",
      accountDeletionProcessing: false,
    };
  }

  componentDidUpdate(prevProps: IProps) {
    if (prevProps.user !== this.props.user) {
      this.handleDiscardChanges();
    }
  }

  render(): Nullable<JSX.Element> {
    const {
      sso,
      alert,
      editMode: edit,
      showDeleteUserAlert,
      accountDeletionProcessing,
    } = this.state;
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
        <SEO
          title="My Account"
          description="Manage your Pairwise user account settings"
        />
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
        <Alert
          icon="trash"
          canEscapeKeyCancel
          canOutsideClickCancel
          isOpen={showDeleteUserAlert}
          cancelButtonText="Cancel"
          intent={Intent.DANGER}
          onCancel={this.handleCancelDeleteUser}
          onConfirm={this.handleConfirmDeleteUser}
          className={isDark ? "bp3-dark" : ""}
          confirmButtonText={"Delete My Account"}
        >
          <p>Are you sure?</p>
          <p>
            This action cannot be undone and will permanently delete all of your
            account activity, course progress, and any existing payment history.
          </p>
          <p>To confirm, type "{DELETE_CONFIRMATION_TEXT}":</p>
          <InputField
            type="text"
            style={{ width: 275, marginTop: 6, marginBottom: 8 }}
            id="user-account-deletion-confirmation-input"
            placeholder="Confirm account deletion"
            className={Classes.INPUT}
            value={this.state.userDeletionTextConfirmation}
            onChange={(event) =>
              this.setState({
                userDeletionTextConfirmation: event.target.value,
              })
            }
          />
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
          <>
            <TextItem style={{ marginBottom: 24 }}>
              Profile is currently using Gravatar for the avatar icon.{" "}
              <ExternalLink link="https://en.gravatar.com/support/what-is-gravatar/">
                Learn more here
              </ExternalLink>
              .
            </TextItem>
            <Checkbox
              checked={this.state.editAvatarUseGravatar}
              label="Use Gravatar for my avatar icon."
              onChange={() =>
                this.setState({
                  editAvatarUseGravatar: !this.state.editAvatarUseGravatar,
                })
              }
            />
          </>
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
        <TextItem id="profile-username">
          <Bold>Username:</Bold> {!edit && profile.username}
        </TextItem>
        {edit && (
          <InputField
            type="text"
            id="edit-input-username"
            placeholder="Enter a username"
            className={Classes.INPUT}
            value={this.state.username}
            onChange={(event) =>
              this.setState({
                username: event.target.value,
              })
            }
          />
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
        <PublicProfileOptInRow>
          <TextItem>
            Enable (only) your username to be shared publicly on the user
            leaderboard, along with your completed challenges and projects
            status.
          </TextItem>
          <Switch
            style={{ marginTop: 8 }}
            checked={profile.optInPublicProfile}
            label={
              profile.optInPublicProfile
                ? "Profile username is publicly viewable"
                : "Profile username is hidden"
            }
            onChange={() =>
              this.handleSwitchPublicProfile(profile.optInPublicProfile)
            }
          />
        </PublicProfileOptInRow>
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
        {profile.coachingSessions > 0 ? (
          <Text style={{ maxWidth: 500 }}>
            You currently have {profile.coachingSessions} career coaching
            session{profile.coachingSessions > 1 ? "s " : " "}with a
            professional developer! To schedule this at anytime reach out to us
            at{" "}
            <a target="__blank" href="mailto:coaching@pairwise.tech">
              <b>coaching@pairwise.tech</b>
            </a>
            .
          </Text>
        ) : (
          <Text style={{ maxWidth: 500 }}>
            You have no coaching sessions currently. If you are interested in a
            30 minute career coaching session with a professional developer,
            reach out to us at{" "}
            <a target="__blank" href="mailto:coaching@pairwise.tech">
              <b>coaching@pairwise.tech</b>
            </a>
            .
          </Text>
        )}
        <PageTitle style={{ marginTop: 24 }}>Questions</PageTitle>
        <Text>
          Feel free to reach out to{" "}
          <a target="__blank" href="mailto:contact@pairwise.tech">
            <b>contact@pairwise.tech</b>
          </a>{" "}
          if you want to contact someone directly.
        </Text>
        <PageTitle style={{ marginTop: 24 }}>Danger Zone</PageTitle>
        <Text style={{ maxWidth: 500 }}>
          Deleting your account will erase all records of your account from
          Pairwise, including any course purchase history. This cannot be
          undone.
        </Text>
        <Button
          icon="trash"
          text="Delete my Account"
          intent={Intent.DANGER}
          style={{ marginTop: 12 }}
          disabled={accountDeletionProcessing}
          onClick={this.openDeleteUserAlert}
        />
      </PageContainer>
    );
  }

  renderPaymentDetails = (payment: Payment, index: number) => {
    const IS_PREMIUM = payment.plan === "PREMIUM";
    return (
      <React.Fragment key={payment.courseId}>
        <PaymentTitle
          style={{ color: COLORS.SECONDARY_YELLOW }}
          id={`account-payment-details-${index}`}
        >
          {this.getCourseTitleFromId(payment.courseId)}
        </PaymentTitle>
        {IS_PREMIUM && (
          <PaymentDetail id="payment-plan-premium-label">
            • Payment Plan:{" "}
            <span style={{ color: COLORS.PRIMARY_GREEN }}>PREMIUM</span>.
          </PaymentDetail>
        )}
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

  handleSwitchPublicProfile = (optInPublicProfile: boolean) => {
    this.props.updateUser({
      optInPublicProfile: !optInPublicProfile,
    });
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
        username: profile.username || "",
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
      username: this.state.username,
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

  openDeleteUserAlert = () => {
    this.setState({ showDeleteUserAlert: true });
  };

  handleCancelDeleteUser = () => {
    this.setState({ showDeleteUserAlert: false });
  };

  handleConfirmDeleteUser = () => {
    const { userDeletionTextConfirmation } = this.state;
    if (userDeletionTextConfirmation === DELETE_CONFIRMATION_TEXT) {
      this.setState(
        {
          showDeleteUserAlert: false,
          accountDeletionProcessing: true,
        },
        this.props.deleteUserAccount,
      );
    } else {
      toaster.warn("The text does not match.");
    }
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
  margin-top: 12px;
`;

const PublicProfileOptInRow = styled.div`
  margin-top: 12px;
  display: flex;
  max-width: 500px;
  flex-direction: column;
  padding-left: 12px;
  padding-right: 12px;
  border-radius: 6px;
  background: rgba(5, 5, 5, 0.45);
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
  deleteUserAccount: Modules.actions.user.deleteUserAccount,
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
