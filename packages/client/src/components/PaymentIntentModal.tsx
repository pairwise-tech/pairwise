import { Button, Dialog } from "@blueprintjs/core";
import styled from "styled-components/macro";
import React from "react";
import { connect } from "react-redux";
import Modules, { ReduxStoreState } from "modules/root";
import { composeWithProps } from "tools/utils";
import { ModalContainer, ModalTitleText, ModalSubText } from "./Shared";
import { COLORS } from "tools/constants";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface IState {}

/** ===========================================================================
 * React Component
 * ----------------------------------------------------------------------------
 * - This component handles purchasing courses.
 * ============================================================================
 */

class PaymentCourseModal extends React.Component<IProps, IState> {
  render(): Nullable<JSX.Element> {
    const { user, courseToPurchase } = this.props;
    const { profile } = user;

    if (!courseToPurchase || !profile) {
      return null;
    }

    return (
      <Dialog
        isOpen={this.props.modalOpen}
        aria-labelledby="simple-modal-title"
        aria-describedby="simple-modal-description"
        onClose={this.handleOnCloseModal}
      >
        <ModalContainer>
          <ModalTitleText>Purchase Course</ModalTitleText>
          <ModalSubText>
            Purchasing the <CourseTitle>{courseToPurchase.title}</CourseTitle>{" "}
            course will give you full lifetime access to the course content and
            is fully refundable up to 30 days.
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

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  user: Modules.selectors.user.userSelector(state),
  modalOpen: Modules.selectors.payments.paymentIntentModalState(state),
  courseToPurchase: Modules.selectors.payments.paymentIntentCourse(state),
});

const dispatchProps = {
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
