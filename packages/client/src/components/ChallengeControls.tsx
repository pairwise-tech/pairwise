import React from "react";
import { connect } from "react-redux";
import {
  Tooltip,
  Classes,
  Card,
  H5,
  Button,
  H4,
  Callout,
} from "@blueprintjs/core";
import { IconNavLink } from "./Shared";
import Modules, { ReduxStoreState } from "modules/root";
import styled from "styled-components/macro";

interface ChallengeButtonProps {
  challengeId?: string;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const PrevChallengeIconButton = connect((state: ReduxStoreState) => ({
  challengeId: Modules.selectors.challenges.nextPrevChallenges(state).prev?.id,
}))(({ challengeId, ...props }: ChallengeButtonProps) => {
  const tooltipMessage = challengeId
    ? "Previous Challenge"
    : "Already at the first challenge";
  return (
    <Tooltip content={tooltipMessage}>
      <IconNavLink
        disabled={!challengeId}
        icon="chevron-left"
        aria-label="Previous Challenge"
        to={`/workspace/${challengeId}`}
        {...props}
      />
    </Tooltip>
  );
});

export const NextChallengeIconButton = connect((state: ReduxStoreState) => ({
  challengeId: Modules.selectors.challenges.nextPrevChallenges(state).next?.id,
}))(({ challengeId, ...props }: ChallengeButtonProps) => {
  const tooltipMessage = challengeId
    ? "Next Challenge"
    : "Already at the last challenge";
  return (
    <Tooltip content={tooltipMessage}>
      <IconNavLink
        disabled={!challengeId}
        icon="chevron-right"
        aria-label="Next Challenge"
        to={`/workspace/${challengeId}`}
        {...props}
      />
    </Tooltip>
  );
});

const NextChallengeButton = ({
  challengeId,
  ...props
}: ChallengeButtonProps) => {
  return (
    <IconNavLink
      disabled={!challengeId}
      icon="chevron-right"
      aria-label="Next Challenge"
      beforeText="Next Challenge"
      id="workspace-next-challenge-button"
      to={`/workspace/${challengeId}`}
      {...props}
    />
  );
};

const cardMapStateToProps = (state: ReduxStoreState) => ({
  challenge: Modules.selectors.challenges.getCurrentChallenge(state),
  nextChallenge: Modules.selectors.challenges.nextPrevChallenges(state).next,
  feedbackDialogOpen: Modules.selectors.feedback.getFeedbackDialogOpen(state),
});

const cardDispatchProps = {
  setFeedbackDialogState: Modules.actions.feedback.setFeedbackDialogState,
};

const cardMergeProps = (
  state: ReturnType<typeof cardMapStateToProps>,
  methods: typeof cardDispatchProps,
  props: {},
) => ({
  challenge: state.challenge,
  nextChallenge: state.nextChallenge,
  toggleFeedbackDialogOpen: (e: React.MouseEvent) => {
    e.preventDefault();
    methods.setFeedbackDialogState(!state.feedbackDialogOpen);
  },
});

export const NextChallengeCard = connect(
  cardMapStateToProps,
  cardDispatchProps,
  cardMergeProps,
)(
  ({
    challenge,
    nextChallenge,
    toggleFeedbackDialogOpen,
  }: ReturnType<typeof cardMergeProps>) => {
    return (
      <Card>
        <Upper icon="info-sign" intent="none">
          <Horizontal>
            <p style={{ marginRight: 10 }}>You just completed:</p>
            <H5>{challenge?.title}</H5>
          </Horizontal>
          <Button
            intent="none"
            icon="help"
            aria-label="open/close feedback dialog"
            onClick={toggleFeedbackDialogOpen}
          >
            Feedback
          </Button>
        </Upper>
        <Horizontal style={{ marginBottom: 10 }}>
          <H5 style={{ color: "rgb(110, 217, 173)", marginRight: 10 }}>
            Up Next
          </H5>
          <H5>
            {nextChallenge
              ? nextChallenge.title
              : "You're on the last challenge!"}
          </H5>
        </Horizontal>
        <NextChallengeButton
          challengeId={nextChallenge?.id}
          className={Classes.INTENT_SUCCESS}
        />
      </Card>
    );
  },
);

const Horizontal = styled.div`
  display: flex;
  align-items: center;
  & > * {
    margin-top: 0;
    margin-bottom: 0;
  }
`;

const Upper = styled(Callout)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px;
  margin-bottom: 20px;
`;
