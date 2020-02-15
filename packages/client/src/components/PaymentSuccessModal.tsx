import { Link } from "react-router-dom";
import { Button, Dialog } from "@blueprintjs/core";
import React from "react";
import { connect } from "react-redux";
import Modules, { ReduxStoreState } from "modules/root";
import { composeWithProps } from "tools/utils";
import { ModalContainer, ModalTitleText, ModalSubText } from "./Shared";

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

class PaymentSuccessModal extends React.Component<IProps, IState> {
  render(): Nullable<JSX.Element> {
    const { user, paymentSuccessCourse } = this.props;
    const { profile } = user;

    if (!paymentSuccessCourse || !profile) {
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
          <ModalTitleText>Thank you, {profile.displayName}!</ModalTitleText>
          <ModalSubText>
            Fantastic! Thank you for purchasing the{" "}
            <b>{paymentSuccessCourse.title}</b> taking the first big step to
            learning to code and becoming a software developer. We know you're
            excited so let's just get right to it! Click the button to get
            started!
          </ModalSubText>
          <Link to={`workspace/${paymentSuccessCourse.id}`}>
            <Button
              large
              intent="success"
              style={{ width: 185 }}
              onClick={this.handleOnCloseModal}
              id="payment-success-modal-get-started"
            >
              Let's get started!
            </Button>
          </Link>
        </ModalContainer>
      </Dialog>
    );
  }

  setModalState = (state: boolean) => {
    this.props.setPaymentSuccessModalState(state);
  };

  handleOnCloseModal = () => {
    this.setModalState(false);
  };
}

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  user: Modules.selectors.user.userSelector(state),
  modalOpen: Modules.selectors.payments.paymentSuccessModalState(state),
  paymentSuccessCourse: Modules.selectors.payments.paymentSuccessCourse(state),
});

const dispatchProps = {
  setPaymentSuccessModalState:
    Modules.actions.payments.setPaymentSuccessModalState,
};

interface ComponentProps {}

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

interface IProps extends ComponentProps, ConnectProps {}

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default composeWithProps<ComponentProps>(withProps)(PaymentSuccessModal);
