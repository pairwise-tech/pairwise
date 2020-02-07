import { Button, Dialog } from "@blueprintjs/core";
import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import { StripeProvider, Elements } from "react-stripe-elements";

import Modules, { ReduxStoreState } from "modules/root";
import { COLORS } from "tools/constants";
import { composeWithProps } from "tools/utils";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface IState {
  showStripeDialog: boolean;
}

/** ===========================================================================
 * React Component
 * ----------------------------------------------------------------------------
 * - This component handles purchasing courses.
 * ============================================================================
 */

class PurchaseCourseModal extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.state = {
      showStripeDialog: false,
    };
  }

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
        onClose={this.handleOnCloseModal}
      >
        {this.state.showStripeDialog ? (
          <StripeProvider apiKey="pk_test_UrBUzJWPNse3I03Bsaxh6WFX00r6rJ1YCq">
            <Elements>
              <div>hi</div>
            </Elements>
          </StripeProvider>
        ) : (
          <AccountModal>
            <TitleText>{course.title}</TitleText>
            <SubText>
              Purchasing the course will give you full lifetime access to this
              course content and is fully refundable up to 30 days and{" "}
            </SubText>
            <Button
              large
              minimal
              intent="primary"
              onClick={this.handleIntentToPurchase}
            >
              Purchase Course!
            </Button>
          </AccountModal>
        )}
      </Dialog>
    );
  }

  handleIntentToPurchase = () => {
    this.setState({ showStripeDialog: true });
  };

  setAccountModalState = (state: boolean) => {
    this.props.setPurchaseCourseModalState(state);
  };

  handleOnCloseModal = () => {
    this.setAccountModalState(false);
    this.setState({ showStripeDialog: false });
  };
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const AccountModal = styled.div`
  width: 525px;
  padding: 32px;
  padding-top: 22px;
  left: 50%;
  top: 50%;
  outline: none;
  position: absolute;
  background: black;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  transform: translate(-50%, -50%);
  border-radius: 6px;
  border: 1px solid ${COLORS.BORDER_MODAL};
  background-color: ${COLORS.BACKGROUND_MODAL};
`;

const TitleText = styled.h1`
  font-size: 24px;
  font-weight: 300;
  text-align: center;
  color: ${COLORS.TEXT_TITLE};
  font-family: Helvetica Neue, Lato, sans-serif;
`;

const SubText = styled(TitleText)`
  font-size: 16px;
  margin-top: 12px;
  max-width: 350px;
  font-weight: 300;
`;

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
