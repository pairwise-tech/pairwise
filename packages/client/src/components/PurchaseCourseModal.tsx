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
    const { user, skeletons } = this.props;
    const { profile } = user;
    const course = skeletons?.find(c => c.id === this.props.coursePurchaseId);

    if (!course || !profile) {
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
            Purchasing the <b>{course.title}</b> course will give you full
            lifetime access to the course content and is fully refundable up to
            30 days.
          </ModalSubText>
          <Button
            large
            intent="primary"
            style={{ marginTop: 24 }}
            onClick={() => this.confirmPurchase(course.id)}
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
  dialogOpen: Modules.selectors.purchase.coursePurchaseModalStateSelector(
    state,
  ),
  user: Modules.selectors.user.userSelector(state),
  coursePurchaseId: Modules.selectors.purchase.coursePurchaseId(state),
  skeletons: Modules.selectors.challenges.getCourseSkeletons(state),
});

const dispatchProps = {
  startCheckout: Modules.actions.purchase.startCheckout,
  setPurchaseCourseModalState:
    Modules.actions.purchase.setPurchaseCourseModalState,
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
