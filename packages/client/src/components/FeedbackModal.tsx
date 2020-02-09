import React, { ChangeEvent, useState } from "react";
import Modules, { ReduxStoreState } from "modules/root";
import { connect } from "react-redux";
import { AccountModal, ModalTitleText, ModalSubText } from "./Shared";
import { Dialog, TextArea, Button } from "@blueprintjs/core";
import FeedbackTypeMenu from "./FeedbackTypeMenu";
import styled from "styled-components";

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

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    if (textAreaIntent !== "none") {
      setTextAreaIntent("none");
    }
    props.setFeedbackState(e.target.value);
  };

  const handleSubmit = () => {
    validate();
    if (props.feedback && props.feedbackType && props.currentChallenge) {
      props.submitUserFeedback({
        feedback: props.feedback,
        type: props.feedbackType,
        challengeId: props.currentChallenge.id,
      });
      props.toggleFeedbackDialogOpen();
    }
  };

  const validate = () => {
    if (!props.feedback) {
      setTextAreaIntent("danger");
    } else {
      setTextAreaIntent("none");
    }

    if (!props.feedbackType) {
      setSelectIntent("danger");
    } else {
      setSelectIntent("none");
    }
  };

  return (
    <Dialog
      usePortal={false}
      isOpen={props.feedbackDialogOpen}
      onClose={props.toggleFeedbackDialogOpen}
      aria-labelledby="feedback-modal-title"
      aria-describedby="feedback-modal-description"
    >
      <AccountModal style={{ maxHeight: "calc(100vh - 100px)" }}>
        <ModalTitleText id="feedback-modal-title">
          Submit Feedback
        </ModalTitleText>
        <ModalSubText
          style={{ maxWidth: 500, textAlign: "left" }}
          id="feedback-modal-description"
        >
          {`Tell us what you think! Provide us with feedback on the
           "${props.currentChallenge?.title}" challenge.`}
        </ModalSubText>
        <FeedbackTypeMenu
          intent={selectIntent}
          onItemSelect={item => {
            setSelectIntent("none");
            props.setFeedbackType(item.value);
          }}
          currentFeedbackType={props.feedbackType}
        />
        <FeedbackInput
          fill={true}
          large={true}
          value={props.feedback}
          onChange={handleChange}
          className={`bp3-intent-${textAreaIntent}`}
        />
        <div style={{ marginLeft: "auto", marginTop: 20 }}>
          <Button
            large={true}
            style={{ marginRight: 10 }}
            onClick={props.toggleFeedbackDialogOpen}
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
      </AccountModal>
    </Dialog>
  );
};

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const FeedbackInput = styled(TextArea)`
  background: #323232 !important;
  margin-top: 10px;
  resize: vertical !important;
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  feedback: Modules.selectors.challenges.getFeedback(state),
  feedbackType: Modules.selectors.challenges.getFeedbackType(state),
  feedbackDialogOpen: Modules.selectors.challenges.getFeedbackDialogOpen(state),
  currentChallenge: Modules.selectors.challenges.getCurrentChallenge(state),
});

const dispatchProps = {
  setFeedbackType: Modules.actions.challenges.setFeedbackType,
  setFeedbackState: Modules.actions.challenges.setFeedbackState,
  setFeedbackDialogState: Modules.actions.challenges.setFeedbackDialogState,
  submitUserFeedback: Modules.actions.challenges.submitUserFeedback,
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
