import { Dialog } from "@blueprintjs/core";
import React from "react";
import { connect } from "react-redux";

import Modules, { ReduxStoreState } from "modules/root";
import { composeWithProps } from "tools/utils";
import { AccountModal, ModalTitleText, ModalSubText } from "./Shared";

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
    const course = this.props.skeletons?.find(
      c => c.id === this.props.coursePurchaseId,
    );

    if (!course) {
      return null;
    }

    return (
      <Dialog
        isOpen={this.props.dialogOpen}
        aria-labelledby="simple-modal-title"
        aria-describedby="simple-modal-description"
        onClose={() => {
          this.setAccountModalState(false);
        }}
      >
        <AccountModal>
          <ModalTitleText>Purchase Course</ModalTitleText>
          <ModalSubText>{course.title}</ModalSubText>
        </AccountModal>
      </Dialog>
    );
  }

  setAccountModalState = (state: boolean) => {
    this.props.setPurchaseCourseModalState(state);
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
  coursePurchaseId: Modules.selectors.purchase.coursePurchaseId(state),
  skeletons: Modules.selectors.challenges.getCourseSkeletons(state),
});

const dispatchProps = {
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
