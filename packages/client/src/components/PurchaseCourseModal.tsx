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

class PurchaseCourseModal extends React.Component<IProps, IState> {
  render(): Nullable<JSX.Element> {
    const { user, courseToPurchase } = this.props;
    const { profile } = user;

    if (!courseToPurchase || !profile) {
      return null;
    }

    return (
      <Dialog
        isOpen={this.props.dialogOpen}
        aria-labelledby="simple-modal-title"
        aria-describedby="simple-modal-description"
        onClose={this.handleOnCloseModal}
      >
        <ModalContainer>
          <ModalTitleText>Purchase Course</ModalTitleText>
          <ModalSubText>
            Purchasing the <b>{courseToPurchase.title}</b> course will give you
            full lifetime access to the course content and is fully refundable
            up to 30 days.
          </ModalSubText>
          <Button
            large
            intent="primary"
            style={{ marginTop: 24 }}
            onClick={() => this.confirmPurchase(courseToPurchase.id)}
          >
            Start Checkout
          </Button>
        </ModalContainer>
      </Dialog>
    );
  }

  confirmPurchase = (courseId: string) => {
    this.props.startCheckout({ courseId });
  };

  setAccountModalState = (state: boolean) => {
    this.props.setPurchaseCourseModalState(state);
  };

  handleOnCloseModal = () => {
    this.setAccountModalState(false);
  };
}

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  dialogOpen: Modules.selectors.payments.coursePurchaseModalStateSelector(
    state,
  ),
  user: Modules.selectors.user.userSelector(state),
  courseToPurchase: Modules.selectors.payments.courseToPurchase(state),
});

const dispatchProps = {
  startCheckout: Modules.actions.payments.startCheckout,
  setPurchaseCourseModalState:
    Modules.actions.payments.setPurchaseCourseModalState,
};

interface ComponentProps {}

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

interface IProps extends ComponentProps, ConnectProps {}

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default composeWithProps<ComponentProps>(withProps)(PurchaseCourseModal);
