import React, { ChangeEvent, useState } from "react";
import Modules, { ReduxStoreState } from "modules/root";
import { connect } from "react-redux";
import { ModalContainer, ModalTitleText, ModalSubText } from "./Shared";
import {
  Dialog,
  TextArea,
  Button,
  Classes,
  Callout,
  H4,
} from "@blueprintjs/core";
import FeedbackTypeMenu from "./FeedbackTypeMenu";
import styled from "styled-components/macro";
import { Link } from "react-router-dom";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

type Props = ReturnType<typeof mergeProps>;

/** ===========================================================================
 * React Component
 * ----------------------------------------------------------------------------
 * This component renders a modal for providing user feedback on a per challenge
 * basis based on set feedback types: Too Hard, Too Easy, Not Helpful and Other
 * ============================================================================
 */

const FeedbackModal = (props: Props) => {
  const [selectIntent, setSelectIntent] = useState<"none" | "danger">("none");
  const [textAreaIntent, setTextAreaIntent] = useState<"none" | "danger">(
    "none",
  );

  const {
    user,
    feedback,
    feedbackType,
    currentChallenge,
    setFeedbackState,
    feedbackDialogOpen,
    submitUserFeedback,
    toggleFeedbackDialogOpen,
  } = props;

  const { profile } = user;
  const email = profile?.email;

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    if (textAreaIntent !== "none") {
      setTextAreaIntent("none");
    }
    setFeedbackState(e.target.value);
  };

  const handleSubmit = () => {
    validate();
    if (feedback && feedbackType && currentChallenge) {
      submitUserFeedback({
        feedback,
        type: feedbackType,
        challengeId: currentChallenge.id,
      });
      toggleFeedbackDialogOpen();
    }
  };

  const validate = () => {
    if (!feedback) {
      setTextAreaIntent("danger");
    } else {
      setTextAreaIntent("none");
    }

    if (!feedbackType) {
      setSelectIntent("danger");
    } else {
      setSelectIntent("none");
    }
  };

  // Construct the modal title, make it more explicit the feedback is
  // specifically for a challenge.
  const modalTitle = currentChallenge
    ? `Feedback for ${currentChallenge.title} Challenge`
    : "Feedback";

  return (
    <Dialog
      usePortal
      isOpen={feedbackDialogOpen}
      onClose={toggleFeedbackDialogOpen}
      aria-labelledby="feedback-modal-title"
      aria-describedby="feedback-modal-description"
    >
      <ModalContainer
        style={{ maxHeight: "calc(100vh - 150px)" }}
        className={Classes.DARK} // Needed since portal modal is outside inherited styles
      >
        <ModalTitleText id="feedback-modal-title">{modalTitle}</ModalTitleText>
        <ModalSubText
          style={{ maxWidth: 500, textAlign: "left" }}
          id="feedback-modal-description"
        >
          {`Tell us what you think! How is the current challenge?`}
        </ModalSubText>
        <DangerLabel show={selectIntent === "danger"}>
          Please select a feedback type!
        </DangerLabel>
        <FeedbackTypeMenu
          intent={selectIntent}
          onItemSelect={(item, e) => {
            setSelectIntent("none");
            props.setFeedbackType(item.value);
          }}
          currentFeedbackType={feedbackType}
        />
        <DangerLabel show={textAreaIntent === "danger"}>
          Enter some feedback so we know how to improve
        </DangerLabel>
        <FeedbackInput
          autoFocus
          fill={true}
          large={true}
          value={props.feedback}
          onChange={handleChange}
          style={{ flexShrink: 0, maxHeight: 180 }}
          className={`bp3-intent-${textAreaIntent}`}
          margintop={textAreaIntent === "danger" ? 0 : 10}
        />
        {email ? null : (
          <Callout style={{ marginTop: 10 }}>
            <H4>Want us to respond?</H4>
            <p>
              We listen. That's one of our principles. We'd love to hear from
              you and we respond to all feedback.
            </p>
            {profile ? (
              <>
                <p>
                  Your account doesn't have an email address. If you'd like a
                  response add an email. This is entirely optional.
                </p>
                <Link to="/account">Update my account</Link>
              </>
            ) : (
              <>
                <p>
                  Want a response? Log in or create an account first and we'll
                  respond directly to your feedback, usually very quickly.
                </p>
                <Button
                  large
                  style={{ width: "100%" }}
                  onClick={() => props.setSingleSignOnDialogState(true)}
                >
                  Log In or Sign Up
                </Button>
              </>
            )}
          </Callout>
        )}
        <div style={{ marginLeft: "auto", marginTop: 20 }}>
          <Button
            large={true}
            style={{ marginRight: 10 }}
            onClick={toggleFeedbackDialogOpen}
          >
            Close
          </Button>
          <Button
            type="submit"
            large={true}
            intent="primary"
            onClick={handleSubmit}
          >
            Submit
          </Button>
        </div>
      </ModalContainer>
    </Dialog>
  );
};

/** ===========================================================================
 * Styles
 * ============================================================================
 */

interface FeedbackInputProps {
  margintop: number;
}

const FeedbackInput = styled(TextArea)<FeedbackInputProps>`
  resize: vertical !important;
  margin-top: ${props => props.margintop}px;
  background: #323232 !important;
`;

interface DangerLabelProps {
  show: boolean;
}

const DangerLabel = styled.label<DangerLabelProps>`
  color: #de4648;
  margin: 10px 0;
  font-weight: bold;
  display: ${props => (props.show ? "block" : "none")};
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  feedback: Modules.selectors.feedback.getFeedback(state),
  feedbackType: Modules.selectors.feedback.getFeedbackType(state),
  feedbackDialogOpen: Modules.selectors.feedback.getFeedbackDialogOpen(state),
  currentChallenge: Modules.selectors.challenges.getCurrentChallenge(state),
  user: Modules.selectors.user.userSelector(state),
});

const dispatchProps = {
  setFeedbackType: Modules.actions.feedback.setFeedbackType,
  setFeedbackState: Modules.actions.feedback.setFeedbackState,
  setFeedbackDialogState: Modules.actions.feedback.setFeedbackDialogState,
  submitUserFeedback: Modules.actions.feedback.submitUserFeedback,
  setSingleSignOnDialogState: Modules.actions.auth.setSingleSignOnDialogState,
};

const mergeProps = (
  state: ReturnType<typeof mapStateToProps>,
  methods: typeof dispatchProps,
  props: {},
) => ({
  ...props,
  ...methods,
  ...state,
  toggleFeedbackDialogOpen: () => {
    methods.setFeedbackDialogState(!state.feedbackDialogOpen);
  },
});

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default connect(
  mapStateToProps,
  dispatchProps,
  mergeProps,
)(FeedbackModal);
