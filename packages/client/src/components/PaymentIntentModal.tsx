import { Button, Dialog, Classes } from "@blueprintjs/core";
import styled from "styled-components/macro";
import React from "react";
import { connect } from "react-redux";
import Modules, { ReduxStoreState } from "modules/root";
import { composeWithProps } from "tools/utils";
import { ModalContainer, ModalTitleText, Loading } from "./SharedComponents";
import { COLORS } from "tools/constants";
import { EMAIL_VERIFICATION_STATUS } from "modules/user/store";
import { defaultTextColor, themeColor } from "./ThemeContainer";

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
    const { user, courseToPurchase, checkoutLoading, emailVerificationStatus } =
      this.props;

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
            <ModalTitleText>Pairwise Beta Launch</ModalTitleText>
            <Text>
              The Pairwise <CourseTitle>{courseToPurchase.title}</CourseTitle>{" "}
              can teach you everything you need to know to begin a career as a
              software developer.
            </Text>
            <Text>
              You can now purchase the course for{" "}
              <HighlightText>$50 USD</HighlightText>. This will allow you to
              lock in full lifetime access to all of the existing and future
              content in this course.
            </Text>
            <Text>
              As an early Pairwise adopter, you will also get a{" "}
              <HighlightText>
                free 30 minute career coaching session
              </HighlightText>{" "}
              with a professional developer with your course purchase.
            </Text>
            <Button
              large
              intent="primary"
              id="start-checkout-button"
              style={{ marginTop: 20, marginBottom: 20 }}
              onClick={() => this.confirmPurchase(courseToPurchase.id)}
            >
              Start Checkout
            </Button>
            <SmallPointText>
              You will be redirected to Stripe to complete the checkout process.
            </SmallPointText>
            <SmallPointText>
              * Purchases are fully refundable up to 30 days after payment.
            </SmallPointText>
          </ModalContainer>
        ) : emailVerificationStatus === EMAIL_VERIFICATION_STATUS.LOADING ? (
          <ModalContainer>
            <ModalTitleText>Sending verification email...</ModalTitleText>
            <Loading />
          </ModalContainer>
        ) : emailVerificationStatus === EMAIL_VERIFICATION_STATUS.SENT ? (
          <ModalContainer>
            <ModalTitleText>Email Sent</ModalTitleText>
            <Text>Please check your email for further instructions.</Text>
          </ModalContainer>
        ) : (
          <ModalContainer>
            <ModalTitleText>Enter Email</ModalTitleText>
            <Text>
              Please provide your email to continue the checkout for{" "}
              <CourseTitle>{courseToPurchase.title}</CourseTitle>.
            </Text>
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
                onChange={(event) =>
                  this.setState({ email: event.target.value })
                }
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
    this.props.startCheckout({ courseId, plan: "PREMIUM" });
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

const CourseTitle = styled.b`
  ${themeColor("color", COLORS.PRIMARY_GREEN, COLORS.TEXT_DARK)};
`;

const Text = styled.p`
  margin-top: 8px;
  text-align: center;
  font-weight: 300;
  ${defaultTextColor};
`;

const HighlightText = styled.b`
  font-weight: bold;
  ${themeColor("color", COLORS.SECONDARY_YELLOW, COLORS.PRIMARY_BLUE)};
`;

const SmallPointText = styled.p`
  font-size: 12px;
  margin-top: 0px;
  font-weight: 100;
  ${defaultTextColor};
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
  background: ${COLORS.BACKGROUND_CONSOLE_DARK} !important;
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
  emailVerificationStatus:
    Modules.selectors.user.emailVerificationStatus(state),
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
