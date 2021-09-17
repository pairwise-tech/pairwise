import { Link } from "react-router-dom";
import styled from "styled-components/macro";
import { Button, Dialog } from "@blueprintjs/core";
import React from "react";
import { connect } from "react-redux";
import Modules, { ReduxStoreState } from "modules/root";
import { composeWithProps } from "tools/utils";
import {
  ModalContainer,
  ModalTitleText,
  ModalSubText,
} from "./SharedComponents";
import { COLORS } from "tools/constants";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface IState {}

/** ===========================================================================
 * React Component
 * ----------------------------------------------------------------------------
 * - This component renders after a user has successfully purchased a
 * course and is redirected back to Pairwise.
 * ============================================================================
 */

class PaymentSuccessModal extends React.Component<IProps, IState> {
  render(): Nullable<JSX.Element> {
    const { user, paymentSuccessCourse } = this.props;
    const { profile, payments } = user;

    if (!paymentSuccessCourse || !profile || !payments) {
      return null;
    }

    const firstChallengeId = paymentSuccessCourse.modules[0].challenges[0].id;
    const lastActiveChallenge = user.lastActiveChallengeIds.lastActiveChallenge;
    const hasCoachingSession = profile.coachingSessions > 0;
    const id = lastActiveChallenge || firstChallengeId;
    const isDark = user.settings.appTheme === "dark";
    const IS_PREMIUM = payments.some((x) => x.plan === "PREMIUM");

    return (
      <Dialog
        isOpen={this.props.modalOpen}
        aria-labelledby="simple-modal-title"
        aria-describedby="simple-modal-description"
        onClose={this.handleOnCloseModal}
      >
        <ModalContainer>
          <ModalTitleText>
            {profile.givenName
              ? `Thank you, ${profile.givenName}!`
              : "Thank you!"}
          </ModalTitleText>
          <ModalSubText style={{ maxWidth: 450 }}>
            Thank you for purchasing the{" "}
            <CourseTitle>{paymentSuccessCourse.title}</CourseTitle> and taking
            the first big step in becoming a software developer.
          </ModalSubText>
          {IS_PREMIUM && (
            <ModalSubText style={{ maxWidth: 450 }}>
              You are a{" "}
              <span
                style={{
                  fontWeight: "bold",
                  color: isDark ? COLORS.SECONDARY_YELLOW : COLORS.PINK,
                }}
              >
                PREMIUM
              </span>{" "}
              member! This means you will have access to one on one coaching
              sessions and other benefits. We will follow up with you directly
              via email on the details shortly.
            </ModalSubText>
          )}
          {hasCoachingSession && !IS_PREMIUM && (
            <ModalSubText style={{ maxWidth: 450 }}>
              Since you are an early adopter, we've given you a free 30 minute
              career coaching session with a professional developer. To schedule
              this at anytime reach out to us at{" "}
              <a target="__blank" href="mailto:coaching@pairwise.tech">
                <b>coaching@pairwise.tech</b>
              </a>
              .
            </ModalSubText>
          )}
          <Link to={`workspace/${id}`}>
            <Button
              large
              intent="success"
              style={{ width: 185, marginTop: 24 }}
              onClick={this.handleOnCloseModal}
              id="payment-success-modal-get-started"
            >
              {lastActiveChallenge ? "Continue Coding" : "Start Coding"}
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
 * Styles
 * ============================================================================
 */

const CourseTitle = styled.b`
  color: ${COLORS.PRIMARY_GREEN};
`;

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
