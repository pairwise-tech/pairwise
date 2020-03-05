import React, { ChangeEvent, useState } from "react";
import Modules, { ReduxStoreState } from "modules/root";
import { connect } from "react-redux";
import { ModalContainer, ModalTitleText, ModalSubText } from "./Shared";
import { Dialog, TextArea, Button } from "@blueprintjs/core";
import FeedbackTypeMenu from "./FeedbackTypeMenu";
import styled from "styled-components/macro";

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
      <ModalContainer style={{ maxHeight: "calc(100vh - 100px)" }}>
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
        <DangerLabel show={selectIntent === "danger"}>
          Please select a feedback type!
        </DangerLabel>
        <FeedbackTypeMenu
          intent={selectIntent}
          onItemSelect={item => {
            setSelectIntent("none");
            props.setFeedbackType(item.value);
          }}
          currentFeedbackType={props.feedbackType}
        />
        <DangerLabel show={textAreaIntent === "danger"}>
          Enter some feedback so we know how to improve
        </DangerLabel>
        <FeedbackInput
          fill={true}
          large={true}
          value={props.feedback}
          onChange={handleChange}
          margintop={textAreaIntent === "danger" ? 0 : 10}
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
});

const dispatchProps = {
  setFeedbackType: Modules.actions.feedback.setFeedbackType,
  setFeedbackState: Modules.actions.feedback.setFeedbackState,
  setFeedbackDialogState: Modules.actions.feedback.setFeedbackDialogState,
  submitUserFeedback: Modules.actions.feedback.submitUserFeedback,
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
