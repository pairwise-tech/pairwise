import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import { Classes, Button } from "@blueprintjs/core";

import Modules, { ReduxStoreState } from "modules/root";
import { PageContainer, Text, PageTitle, ProfileIcon } from "./Shared";
import { COLORS } from "tools/constants";
import { Payment } from "@pairwise/common";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface IState {
  givenName: string;
  familyName: string;
  displayName: string;
  edit: boolean;
}

/** ===========================================================================
 * Account
 * ============================================================================
 */

class Account extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.state = {
      givenName: "",
      familyName: "",
      displayName: "",
      edit: false,
    };
  }

  componentWillReceiveProps(nextProps: IProps) {
    if (nextProps.user !== this.props.user) {
      this.handleDiscardChanges();
    }
  }

  render(): Nullable<JSX.Element> {
    const { edit } = this.state;
    const { user, skeletons } = this.props;
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
            onChange={event => this.setState({ givenName: event.target.value })}
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
              this.setState({ familyName: event.target.value })
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
              this.setState({ displayName: event.target.value })
            }
          />
        )}
        <TextItem>
          <Bold>Email:</Bold> {!edit && profile.email}
        </TextItem>
        {edit && (
          <InputField
            disabled
            type="text"
            className={Classes.INPUT}
            value={profile.email}
            onChange={() => null}
          />
        )}
        {edit && (
          <TextItem style={{ fontSize: 12 }}>
            (Your email is linked to your 3rd party signin account and cannot be
            changed)
          </TextItem>
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
          <React.Fragment>
            <PageTitle style={{ marginTop: 24 }}>Payments</PageTitle>
            <Text>
              These are your purchased courses. After purchasing a course, you
              will have lifetime access.
            </Text>
            {payments.map(this.renderPaymentDetails)}
          </React.Fragment>
        )}
      </PageContainer>
    );
  }
  renderPaymentDetails = (payment: Payment) => {
    return (
      <PaymentContainer>
        <Text>
          <b>Date Paid:</b>
          {payment.datePaid}
        </Text>
        <Text>
          <b>Amount Paid:</b>
          {payment.amountPaid}
        </Text>
        <Text>
          <b>Course:</b>
          {this.getCourseTitleFromId(payment.courseId)}
        </Text>
      </PaymentContainer>
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
        edit: true,
        givenName: profile.givenName,
        familyName: profile.familyName,
        displayName: profile.displayName,
      });
    }
  };

  handleSaveChanges = () => {
    const userDetails = {
      givenName: this.state.givenName,
      familyName: this.state.familyName,
      displayName: this.state.displayName,
    };
    this.props.updateUser(userDetails);
  };

  handleDiscardChanges = () => {
    this.setState({ edit: false });
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

const PaymentContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 12px;
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  user: Modules.selectors.user.userSelector(state),
  skeletons: Modules.selectors.challenges.courseSkeletons(state),
});

const dispatchProps = {
  initializeApp: Modules.actions.app.initializeApp,
  updateUser: Modules.actions.user.updateUser,
};

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

type IProps = ConnectProps;

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default withProps(Account);
