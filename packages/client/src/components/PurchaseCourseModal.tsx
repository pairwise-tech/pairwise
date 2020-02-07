import { Button, Dialog } from "@blueprintjs/core";
import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import {
  injectStripe,
  CardElement,
  StripeProvider,
  Elements,
} from "react-stripe-elements";
import Modules, { ReduxStoreState } from "modules/root";
import { COLORS } from "tools/constants";
import { composeWithProps } from "tools/utils";
import { STRIPE_API_KEY } from "tools/client-env";
import { UserState } from "modules/user";

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
        <AccountModal>
          <TitleText>{course.title}</TitleText>
          <SubText>
            Purchasing the course will give you full lifetime access to this
            course content and is fully refundable up to 30 days and{" "}
          </SubText>
          <StripeProvider apiKey={STRIPE_API_KEY}>
            <div className="stripe-checkout">
              <Elements>
                <StripeCheckoutForm course={course} />
              </Elements>
            </div>
          </StripeProvider>
          <Button
            large
            minimal
            intent="primary"
            style={{ marginTop: 12 }}
            onClick={this.confirmPurchase}
          >
            Confirm Order
          </Button>
        </AccountModal>
      </Dialog>
    );
  }

  confirmPurchase = () => {
    console.log("handle purchase ~");
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

type X = any;

interface CheckoutFormProps extends X {
  user: UserState;
}

class CheckoutForm extends React.Component<CheckoutFormProps, any> {
  handleSubmit = (ev: any) => {
    ev.preventDefault();

    const cardElement = this.props.elements.getElement("card");
    this.props.stripe
      .createPaymentMethod({
        type: "card",
        card: cardElement,
        billing_details: { name: "" },
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

    this.props.stripe.createToken({ type: "card", name: "" });
    this.props.stripe.createSource({
      type: "card",
      owner: {
        name: "",
      },
    });
  };

  render() {
    return (
      <form onSubmit={this.handleSubmit} style={{ width: "500px" }}>
        <Elements>
          <PaymentBioForm />
        </Elements>
        <CardSection />
      </form>
    );
  }
}

class CardSection extends React.Component {
  render() {
    return (
      <label>
        Card details
        <CardElement style={{ base: { fontSize: "18px" } }} />
      </label>
    );
  }
}

const StripeCheckoutForm = injectStripe(CheckoutForm);

class NameForm extends React.Component<any, any> {
  render() {
    return (
      <>
        <label>
          Name
          <input name="name" type="text" placeholder="Jane Doe" required />
        </label>
        <label>
          Email
          <input
            name="email"
            type="email"
            placeholder="jane.doe@example.com"
            required
          />
        </label>
      </>
    );
  }
}

const PaymentBioForm = injectStripe(NameForm);

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const AccountModal = styled.div`
  width: 650px;
  height: 650px;
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
  /* background-color: ${COLORS.BACKGROUND_MODAL}; */
  background-color: ${COLORS.TEXT_WHITE};
`;

const TitleText = styled.h1`
  font-size: 24px;
  font-weight: 300;
  text-align: center;
  /* color: ${COLORS.TEXT_TITLE}; */
  color: ${COLORS.TEXT_DARK};
  font-family: Helvetica Neue, Lato, sans-serif;
`;

const SubText = styled(TitleText)`
  font-size: 16px;
  margin-top: 12px;
  max-width: 525px;
  font-weight: 300;
  color: ${COLORS.TEXT_DARK};
`;

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
