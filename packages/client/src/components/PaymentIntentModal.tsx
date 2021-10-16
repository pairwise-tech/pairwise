import { Button, Dialog, Classes } from "@blueprintjs/core";
import styled from "styled-components/macro";
import React from "react";
import { connect } from "react-redux";
import Modules, { ReduxStoreState } from "modules/root";
import { composeWithProps } from "tools/utils";
import { ModalContainer, ModalTitleText, Loading } from "./SharedComponents";
import { COLORS, MOBILE } from "tools/constants";
import { EMAIL_VERIFICATION_STATUS } from "modules/user/store";
import { defaultTextColor, themeColor } from "./ThemeContainer";
import { CourseSkeleton, PAYMENT_PLAN } from "@pairwise/common";

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
    const isDark = user.settings.appTheme === "dark";

    return (
      <Dialog
        className={isDark ? Classes.DARK : ""}
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
          <PaymentModal>
            <PaymentPlanThree>
              <PlanTitleContainerThree>
                <PlanTitleText>{courseToPurchase.title}</PlanTitleText>
              </PlanTitleContainerThree>
              {this.renderCourseToPurchaseDetails(courseToPurchase)}
              <ButtonContainer>
                <Button
                  large
                  icon="tick-circle"
                  intent="success"
                  id="start-checkout-button-regular"
                  style={{ marginTop: 18, marginBottom: 18 }}
                  onClick={() =>
                    this.handleSelectPaymentPlan(courseToPurchase.id, "REGULAR")
                  }
                >
                  Proceed to Checkout
                </Button>
              </ButtonContainer>
            </PaymentPlanThree>
          </PaymentModal>
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

  handleSelectPaymentPlan = (courseId: string, plan: PAYMENT_PLAN) => {
    this.props.startCheckout({ courseId, plan });
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

  renderCourseToPurchaseDetails = (course: CourseSkeleton) => {
    if (course.id === "fpvPtfu7s") {
      // TypeScript
      return (
        <PlanContentBox>
          <PriceText>
            <span style={{ textDecoration: "underline" }}>Price:</span>{" "}
            <HighlightText>$50</HighlightText>
          </PriceText>
          <Text>
            • 12 course modules covering fullstack web+mobile development
          </Text>
          <Text>• 500+ coding challenges</Text>
          <Text>• 20+ projects</Text>
          <Text>• Video explanations for all challenges</Text>
          <Text>
            • As an early Pairwise adopter, you will also get a{" "}
            <HighlightText>
              free 30 minute career coaching session
            </HighlightText>{" "}
            with a professional developer
          </Text>
        </PlanContentBox>
      );
    } else if (course.id === "alosiqu45") {
      // Rust
      return (
        <PlanContentBox>
          <PriceText>
            <span style={{ textDecoration: "underline" }}>Price:</span>{" "}
            <HighlightText>$50</HighlightText>
          </PriceText>
          <Text>
            • 12 course modules covering the Rust Programming Language
          </Text>
          <Text>• 150+ coding challenges</Text>
          <Text>• 5+ projects</Text>
          <Text>• Video explanations for all challenges</Text>
        </PlanContentBox>
      );
    } else {
      console.log("New course to handle: ", course.title);
    }
  };

  // Currently not used
  renderFullPaymentModal = () => {
    const { user, courseToPurchase } = this.props;
    const { profile } = user;
    if (!courseToPurchase || !profile) {
      return null;
    }

    const isDark = user.settings.appTheme === "dark";

    return (
      <PaymentModal>
        <ModalTitleText style={{ fontSize: 22 }}>
          Choose a Payment Option
        </ModalTitleText>
        <PaymentPlanContainer>
          <PaymentPlanOne>
            <PlanTitleContainerOne>
              <PlanTitleText>Basic</PlanTitleText>
            </PlanTitleContainerOne>
            <PlanContentBox>
              <PriceText>
                Price: <HighlightText>FREE</HighlightText>
              </PriceText>
              <Text>• First 3 course modules: HTML, CSS, TypeScript</Text>
              <Text>• Video explanations for all 3 modules</Text>
            </PlanContentBox>
          </PaymentPlanOne>
          <PaymentPlanTwo>
            <PlanTitleContainerTwo>
              <PlanTitleText>Member</PlanTitleText>
            </PlanTitleContainerTwo>
            <PlanContentBox>
              <PriceText>
                Price: <HighlightText>$50</HighlightText>
              </PriceText>
              <Text>• First 3 course modules: HTML, CSS, TypeScript</Text>
              <Text>
                • Entire paid course content (600 challenges covering fullstack
                web+mobile development)
              </Text>
              <Text>• Video explanations for all challenges</Text>
              <Text>
                • As an early Pairwise adopter, you will also get a{" "}
                <HighlightText>
                  free 30 minute career coaching session
                </HighlightText>{" "}
                with a professional developer
              </Text>
            </PlanContentBox>
            <ButtonContainer>
              <Button
                large
                icon="tick-circle"
                intent="success"
                id="start-checkout-button-regular"
                style={{ marginTop: 18, marginBottom: 18 }}
                onClick={() =>
                  this.handleSelectPaymentPlan(courseToPurchase.id, "REGULAR")
                }
              >
                Choose Member
              </Button>
            </ButtonContainer>
          </PaymentPlanTwo>
          <PaymentPlanThree>
            <PlanTitleContainerThree
              style={{
                border: `1px solid ${
                  isDark ? COLORS.PRIMARY_GREEN : COLORS.PINK
                }`,
              }}
            >
              <PlanTitleText
                style={{
                  color: isDark ? COLORS.PRIMARY_GREEN : COLORS.PINK,
                }}
              >
                Premium
              </PlanTitleText>
            </PlanTitleContainerThree>
            <PlanContentBox>
              <PriceText>
                Price: <HighlightText>$500</HighlightText>
              </PriceText>
              <Text>• First 3 course modules: HTML, CSS, TypeScript</Text>
              <Text>
                • Entire paid course content (600 challenges covering fullstack
                web+mobile development)
              </Text>
              <Text>• Video explanations for all challenges</Text>
              <Text>
                • Three one hour coaching sessions with a professional developer
              </Text>
              <Text>• Access to Pairwise Slack/Discord community</Text>
              <Text>• 1:1 support throughout your learning experience</Text>
              <Text>• Personalized code/project review</Text>
            </PlanContentBox>
            <ButtonContainer>
              <Button
                large
                icon="star"
                intent="primary"
                style={{ marginTop: 18, marginBottom: 18 }}
                id="start-checkout-button-premium"
                onClick={() =>
                  this.handleSelectPaymentPlan(courseToPurchase.id, "PREMIUM")
                }
              >
                Choose Premium
              </Button>
            </ButtonContainer>
          </PaymentPlanThree>
        </PaymentPlanContainer>
        <SmallPointText>
          You will be redirected to Stripe to complete the checkout process.
        </SmallPointText>
        <SmallPointText>
          While Pairwise is in <b>beta</b> you can refund your purchase at
          anytime.
        </SmallPointText>
      </PaymentModal>
    );
  };
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const PlanColors = {
  PAYMENT_PLAN_TITLE_BOX_DARK_1: "rgb(40, 40, 40)",
  PAYMENT_PLAN_TITLE_BOX_LIGHT_1: "rgb(225, 225, 225)",
  PAYMENT_PLAN_BOX_DARK_1: "rgb(32, 32, 32)",
  PAYMENT_PLAN_BOX_LIGHT_1: "rgb(245, 245, 245)",

  PAYMENT_PLAN_TITLE_BOX_DARK_2: "rgb(55, 55, 55)",
  PAYMENT_PLAN_TITLE_BOX_LIGHT_2: "rgb(215, 215, 215)",
  PAYMENT_PLAN_BOX_DARK_2: "rgb(42, 42, 42)",
  PAYMENT_PLAN_BOX_LIGHT_2: "rgb(235, 235, 235)",

  PAYMENT_PLAN_TITLE_BOX_DARK_3: "rgb(80, 80, 80)",
  PAYMENT_PLAN_TITLE_BOX_LIGHT_3: "rgb(210, 210, 210)",
  PAYMENT_PLAN_BOX_DARK_3: "rgb(55, 55, 55)",
  PAYMENT_PLAN_BOX_LIGHT_3: "rgb(205, 205, 205)",
};

const PaymentModal = styled.div`
  width: auto;
  padding: 22px 32px;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  outline: none;
  position: absolute;
  background: black;
  border-radius: 6px;
  border: 1px solid ${COLORS.BORDER_MODAL};

  ${themeColor(
    "background",
    COLORS.BACKGROUND_MODAL_DARK,
    COLORS.BACKGROUND_MODAL_LIGHT,
  )};

  @media ${MOBILE} {
    top: 15vh;
    left: auto;
    transform: none;
    width: 95vw;
    margin-left: 2.5vw;
  }
`;

const CourseTitle = styled.b`
  ${themeColor("color", COLORS.PRIMARY_GREEN, COLORS.TEXT_DARK)};
`;

const PriceText = styled.p`
  margin: 24px;
  text-align: center;
  font-size: 24px;
  ${defaultTextColor};
`;

const Text = styled.p`
  margin-top: 4px;
  margin-bottom: 0px;
  text-align: left;
  font-weight: 300;
  font-size: 18px;
  ${defaultTextColor};
`;

const HighlightText = styled.b`
  font-weight: bold;
  ${themeColor("color", COLORS.SECONDARY_YELLOW, COLORS.PINK)};
`;

const SmallPointText = styled.p`
  font-size: 12px;
  margin-top: 4px;
  margin-bottom: 4px;
  font-weight: 100;
  text-align: center;
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

const PaymentPlanContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  padding: 12px;

  @media ${MOBILE} {
    flex-direction: column;
  }
`;

const PaymentPlan = styled.div`
  padding: 8px 12px;
  width: 450px;
  height: 450px;
  display: block;
  margin: 6px;
  border-radius: 6px;

  @media ${MOBILE} {
    height: auto;
  }
`;

const PaymentPlanOne = styled(PaymentPlan)`
  ${themeColor(
    "background",
    PlanColors.PAYMENT_PLAN_BOX_DARK_1,
    PlanColors.PAYMENT_PLAN_BOX_LIGHT_1,
  )};
`;

const PaymentPlanTwo = styled(PaymentPlan)`
  ${themeColor(
    "background",
    PlanColors.PAYMENT_PLAN_BOX_DARK_2,
    PlanColors.PAYMENT_PLAN_BOX_LIGHT_2,
  )};
`;

const PaymentPlanThree = styled(PaymentPlan)`
  ${themeColor(
    "background",
    PlanColors.PAYMENT_PLAN_BOX_DARK_3,
    PlanColors.PAYMENT_PLAN_BOX_LIGHT_3,
  )};
`;

const PlanContentBox = styled.div`
  height: 265px;

  @media ${MOBILE} {
    height: auto;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const PlanTitleText = styled.h1`
  margin: 2px;
  font-size: 28px;
  font-weight: 400;
  text-align: center;
  font-family: Helvetica Neue, Lato, sans-serif;
  ${themeColor("color", COLORS.TEXT_WHITE, COLORS.TEXT_LIGHT_THEME)};
`;

export const PlanTitleContainer = styled.div`
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid transparent;
`;

export const PlanTitleContainerOne = styled(PlanTitleContainer)`
  ${themeColor(
    "background",
    PlanColors.PAYMENT_PLAN_TITLE_BOX_DARK_1,
    PlanColors.PAYMENT_PLAN_TITLE_BOX_LIGHT_1,
  )};
`;

export const PlanTitleContainerTwo = styled(PlanTitleContainer)`
  ${themeColor(
    "background",
    PlanColors.PAYMENT_PLAN_TITLE_BOX_DARK_2,
    PlanColors.PAYMENT_PLAN_TITLE_BOX_LIGHT_2,
  )};
`;

export const PlanTitleContainerThree = styled(PlanTitleContainer)`
  ${themeColor(
    "background",
    PlanColors.PAYMENT_PLAN_TITLE_BOX_DARK_3,
    PlanColors.PAYMENT_PLAN_TITLE_BOX_LIGHT_3,
  )};
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
