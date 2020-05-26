import { Button, Dialog, Classes } from "@blueprintjs/core";
import styled from "styled-components/macro";
import React from "react";
import { connect } from "react-redux";
import Modules, { ReduxStoreState } from "modules/root";
import { composeWithProps } from "tools/utils";
import {
  ModalContainer,
  ModalTitleText,
  ModalSubText,
  Loading,
} from "./Shared";
import { COLORS } from "tools/constants";
import { EMAIL_VERIFICATION_STATUS } from "modules/user/store";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface IState {
  email: string;
}

/** ===========================================================================
 * React Component
 * ----------------------------------------------------------------------------
 * - This component handles purchasing courses.
 * ============================================================================
 */

class PaymentCourseModal extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.state = {
      email: "",
    };
  }

  render(): Nullable<JSX.Element> {
    const {
      user,
      courseToPurchase,
      checkoutLoading,
      emailVerificationStatus,
    } = this.props;
    const { profile } = user;

    if (!courseToPurchase || !profile) {
      return null;
    }

    // If the user does not have an email set yet require it
    // before allowing them to proceed with checkout.
    const hasEmail = !!profile.email;

    return (
      <Dialog
        isOpen={this.props.modalOpen}
        aria-labelledby="simple-modal-title"
        aria-describedby="simple-modal-description"
        onClose={this.handleOnCloseModal}
      >
        {checkoutLoading ? (
          <ModalContainer>
            <ModalTitleText>Starting Checkout...</ModalTitleText>
            <Loading intent="primary" />
          </ModalContainer>
        ) : hasEmail ? (
          <ModalContainer>
            <ModalTitleText>Purchase Course</ModalTitleText>
            <ModalSubText>
              Purchasing the <CourseTitle>{courseToPurchase.title}</CourseTitle>{" "}
              course will give you full lifetime access to the course content
              and is fully refundable up to 60 days.
            </ModalSubText>
            <ModalSubText>
              <b>Please note: </b>We are still building the course content! We
              will be continuously adding additional content as we complete it,
              and aim for the initial version of the course to be completed by
              the end of 2020. Your course purchase will give you access to all
              of the course content which we add in the future.
            </ModalSubText>
            <Button
              large
              intent="primary"
              id="start-checkout-button"
              style={{ marginTop: 20 }}
              onClick={() => this.confirmPurchase(courseToPurchase.id)}
            >
              Start Checkout
            </Button>
            <SmallPoint>
              You will be redirected to Stripe to complete the checkout process.
            </SmallPoint>
          </ModalContainer>
        ) : emailVerificationStatus === EMAIL_VERIFICATION_STATUS.LOADING ? (
          <ModalContainer>
            <ModalTitleText>Sending verification email...</ModalTitleText>
            <Loading />
          </ModalContainer>
        ) : emailVerificationStatus === EMAIL_VERIFICATION_STATUS.SENT ? (
          <ModalContainer>
            <ModalTitleText>Email Sent</ModalTitleText>
            <ModalSubText>
              Please check your email for further instructions.
            </ModalSubText>
          </ModalContainer>
        ) : (
          <ModalContainer>
            <ModalTitleText>Enter Email</ModalTitleText>
            <ModalSubText>
              Please provide your email to continue the checkout for{" "}
              <CourseTitle>{courseToPurchase.title}</CourseTitle>.
            </ModalSubText>
            <EmailForm
              onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                this.updateUserEmail();
              }}
            >
              <InputField
                autoFocus
                type="text"
                className={Classes.INPUT}
                placeholder="Enter your email"
                value={this.state.email}
                onChange={event => this.setState({ email: event.target.value })}
              />
              <Button
                text="Save Email"
                intent="success"
                id="email-login-button"
                onClick={this.updateUserEmail}
                style={{ marginLeft: 8, width: 95 }}
              />
            </EmailForm>
          </ModalContainer>
        )}
      </Dialog>
    );
  }

  confirmPurchase = (courseId: string) => {
    this.props.startCheckout({ courseId });
  };

  setModalState = (state: boolean) => {
    this.props.setPurchaseCourseModalState(state);
  };

  handleOnCloseModal = () => {
    this.setModalState(false);
  };

  updateUserEmail = () => {
    this.props.updateUserEmail(this.state.email);
  };
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const SmallPoint = styled.p`
  font-size: 12px;
  margin-top: 26px;
  color: ${COLORS.TEXT_CONTENT};
`;

const CourseTitle = styled.b`
  color: ${COLORS.PRIMARY_GREEN};
`;

const EmailForm = styled.form`
  margin-top: 12px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const InputField = styled.input`
  width: 325px;
  color: ${COLORS.TEXT_HOVER} !important;
  background: ${COLORS.BACKGROUND_CONSOLE} !important;
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  user: Modules.selectors.user.userSelector(state),
  checkoutLoading: Modules.selectors.payments.checkoutLoading(state),
  modalOpen: Modules.selectors.payments.paymentIntentModalState(state),
  courseToPurchase: Modules.selectors.payments.paymentIntentCourse(state),
  emailVerificationStatus: Modules.selectors.user.emailVerificationStatus(
    state,
  ),
});

const dispatchProps = {
  updateUserEmail: Modules.actions.user.updateUserEmail,
  startCheckout: Modules.actions.payments.startCheckout,
  setPurchaseCourseModalState:
    Modules.actions.payments.setPaymentCourseModalState,
};

interface ComponentProps {}

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

interface IProps extends ComponentProps, ConnectProps {}

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default composeWithProps<ComponentProps>(withProps)(PaymentCourseModal);
