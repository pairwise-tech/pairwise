import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import { Classes, Button } from "@blueprintjs/core";
import Modules, { ReduxStoreState } from "modules/root";
import { PageContainer, Text, PageTitle, ProfileIcon } from "./Shared";
import { COLORS } from "tools/constants";
import { Payment } from "@pairwise/common";
import { formatDate } from "tools/utils";
import { EMAIL_VERIFICATION_STATUS } from "modules/user/store";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface IState {
  email: string;
  givenName: string;
  familyName: string;
  displayName: string;
  editMode: boolean;
  editedEmail: boolean;
  editedProfile: boolean;
}

/** ===========================================================================
 * Account
 * ============================================================================
 */

class Account extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.state = {
      email: "",
      givenName: "",
      familyName: "",
      displayName: "",
      editMode: false,
      editedEmail: false,
      editedProfile: false,
    };
  }

  componentDidUpdate(prevProps: IProps) {
    if (prevProps.user !== this.props.user) {
      this.handleDiscardChanges();
    }
  }

  render(): Nullable<JSX.Element> {
    const { editMode: edit } = this.state;
    const { user, skeletons, verificationEmailProcessing } = this.props;
    const { payments, profile } = user;
    if (!payments || !profile || !skeletons) {
      return null;
    }

    return (
      <PageContainer>
        <PageTitle>Account</PageTitle>
        <ProfileIcon
          width={95}
          height={95}
          style={{ marginBottom: 12 }}
          avatar={profile.avatarUrl}
        />
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
            onChange={event =>
              this.setState({
                editedProfile: true,
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
            onChange={event =>
              this.setState({
                editedProfile: true,
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
            onChange={event =>
              this.setState({
                editedProfile: true,
                displayName: event.target.value,
              })
            }
          />
        )}
        {verificationEmailProcessing === EMAIL_VERIFICATION_STATUS.LOADING ? (
          <TextItem>* Sending verification email...</TextItem>
        ) : verificationEmailProcessing === EMAIL_VERIFICATION_STATUS.SENT ? (
          <TextItem style={{ color: COLORS.PRIMARY_GREEN }}>
            * Please check your email for a verification link.
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
                onChange={event =>
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
                * Please enter your email to receive course and product updates.
              </TextItem>
            ) : (
              <TextItem style={{ color: COLORS.TEXT_CONTENT, fontSize: 12 }}>
                * Note: To change your email you will need to verify the new
                email address.
              </TextItem>
            )}
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
      </PageContainer>
    );
  }

  renderPaymentDetails = (payment: Payment, index: number) => {
    return (
      <React.Fragment key={payment.courseId}>
        <PaymentTitle id={`account-payment-details-${index}`}>
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
      const course = skeletons.find(c => c.id === id);
      if (course) {
        return course.title;
      }

      return id; /* Shouldn't happen but just fallback to the course id... */
    }
  };

  handleEditProfile = () => {
    const { profile } = this.props.user;
    if (profile) {
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
    if (this.state.editedProfile) {
      const userDetails = {
        givenName: this.state.givenName,
        familyName: this.state.familyName,
        displayName: this.state.displayName,
      };
      this.props.updateUser(userDetails);
    }

    if (this.state.editedEmail) {
      this.props.updateUserEmail(this.state.email);
    }

    this.setState({ editMode: false });
  };

  handleDiscardChanges = () => {
    this.setState({ editMode: false });
  };
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const TextItem = styled(Text)`
  margin-top: 12px;
  color: ${COLORS.TEXT_CONTENT_BRIGHT};
`;

const PaymentTitle = styled(Text)`
  font-size: 22px;
  margin-top: 16px;
  font-weight: bold;
  color: ${COLORS.TEXT_CONTENT_BRIGHT};
`;

const PaymentDetail = styled(Text)`
  font-size: 12px;
  color: ${COLORS.TEXT_CONTENT};
`;

const Bold = styled.b`
  font-weight: bold;
  color: ${COLORS.TEXT_CONTENT};
`;

const InputField = styled.input`
  margin-top: 12px;
  width: 200px;
  color: ${COLORS.TEXT_HOVER} !important;
  background: ${COLORS.BACKGROUND_CONSOLE} !important;
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
  skeletons: Modules.selectors.challenges.courseSkeletons(state),
  verificationEmailProcessing: Modules.selectors.user.verificationEmailProcessing(
    state,
  ),
});

const dispatchProps = {
  initializeApp: Modules.actions.app.initializeApp,
  updateUser: Modules.actions.user.updateUser,
  updateUserEmail: Modules.actions.user.updateUserEmail,
};

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

type IProps = ConnectProps;

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default withProps(Account);
