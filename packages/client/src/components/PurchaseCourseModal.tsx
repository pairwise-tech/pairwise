import { Button, Dialog } from "@blueprintjs/core";
import React from "react";
import { connect } from "react-redux";
import {
  injectStripe,
  CardElement,
  StripeProvider,
  Elements,
} from "react-stripe-elements";
import Modules, { ReduxStoreState } from "modules/root";
import { composeWithProps } from "tools/utils";
import { STRIPE_API_KEY } from "tools/client-env";
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

class PurchaseCourseModal extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.state = {};
  }

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
          {/* <StripeProvider apiKey={STRIPE_API_KEY}>
            <div className="stripe-checkout">
              <Elements>
                <StripeCheckoutForm profile={profile} course={course} />
              </Elements>
            </div>
          </StripeProvider> */}
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
 * Stripe Checkout Form
 * ============================================================================
 */

class CheckoutForm extends React.Component<any, any> {
  handleSubmit = (ev: any) => {
    ev.preventDefault();

    const name = this.props.profile.displayName;

    const cardElement = this.props.elements.getElement("card");
    this.props.stripe
      .createPaymentMethod({
        type: "card",
        card: cardElement,
        billing_details: { name },
      })
      .then(({ paymentMethod }: any) => {
        console.log("Received Stripe PaymentMethod:", paymentMethod);
      });

    this.props.stripe.confirmCardPayment("{PAYMENT_INTENT_CLIENT_SECRET}", {
      payment_method: {
        card: cardElement,
      },
    });

    this.props.stripe.confirmCardSetup("{PAYMENT_INTENT_CLIENT_SECRET}", {
      payment_method: {
        card: cardElement,
      },
    });

    this.props.stripe.createToken({ type: "card", name });
    this.props.stripe.createSource({
      type: "card",
      owner: {
        name,
      },
    });
  };

  render() {
    return (
      <>
        <form onSubmit={this.handleSubmit} style={{ width: "500px" }}>
          <CardSection />
        </form>
        <div style={{ textAlign: "center" }}>
          {/* <Button
            large
            intent="primary"
            style={{ marginTop: 24 }}
            onClick={this.handleSubmit}
          >
            Submit Order
          </Button> */}
        </div>
      </>
    );
  }
}

class CardSection extends React.Component {
  render() {
    return (
      <label>
        Card details
        <CardElement
          iconStyle="solid"
          style={{
            empty: {
              fontWeight: 100,
              color: COLORS.TEXT_WHITE,
              fontFamily: "Helvetica Neue, Lato, sans-serif",
            },
            base: {
              fontWeight: 100,
              color: COLORS.TEXT_WHITE,
              fontFamily: "Helvetica Neue, Lato, sans-serif",
            },
            invalid: { color: COLORS.FAILURE },
          }}
        />
      </label>
    );
  }
}

const StripeCheckoutForm = injectStripe(CheckoutForm);

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
