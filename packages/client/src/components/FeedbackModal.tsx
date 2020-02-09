import React, { ChangeEvent } from "react";
import Modules, { ReduxStoreState } from "modules/root";
import { connect } from "react-redux";
import { AccountModal, ModalTitleText, ModalSubText } from "./Shared";
import { Dialog, TextArea } from "@blueprintjs/core";
import FeedbackTypeMenu from "./FeedbackTypeMenu";
import styled from "styled-components";

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
  handleChange: (e: ChangeEvent<HTMLTextAreaElement>) => {
    methods.setFeedbackState(e.target.value);
  },
});

type Props = ReturnType<typeof mergeProps>;

export default connect(
  mapStateToProps,
  dispatchProps,
  mergeProps,
)((props: Props) => {
  return (
    <Dialog
      isOpen={props.feedbackDialogOpen}
      usePortal={false}
      onClose={props.toggleFeedbackDialogOpen}
    >
      <AccountModal>
        <ModalTitleText>
          {`${props.currentChallenge?.title} Feedback`}
        </ModalTitleText>
        <FeedbackTypeMenu
          onItemSelect={item => props.setFeedbackType(item.value)}
          currentFeedbackType={props.feedbackType}
        />
        <FeedbackInput
          fill={true}
          large={true}
          growVertically={true}
          value={props.feedback}
          onChange={props.handleChange}
        />
      </AccountModal>
    </Dialog>
  );
});

const FeedbackInput = styled(TextArea)`
  background: #323232 !important;
  margin-top: 10px;
`;
