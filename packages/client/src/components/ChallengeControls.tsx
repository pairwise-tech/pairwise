import React from "react";
import { connect } from "react-redux";
import { Tooltip, Classes, Card, H5, Button, Callout } from "@blueprintjs/core";
import { IconNavLink } from "./Shared";
import Modules, { ReduxStoreState } from "modules/root";
import styled from "styled-components/macro";
import { getChallengeSlug } from "@pairwise/common";

interface ChallengeButtonProps {
  slug: string | null;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const PrevChallengeIconButton = connect((state: ReduxStoreState) => {
  const { prev } = Modules.selectors.challenges.nextPrevChallenges(state);
  return {
    slug: prev ? getChallengeSlug(prev) : null,
  };
})(({ slug, ...props }: ChallengeButtonProps) => {
  const tooltipMessage = slug
    ? "Previous Challenge"
    : "Already at the first challenge";
  return (
    <Tooltip content={tooltipMessage}>
      <IconNavLink
        disabled={!slug}
        icon="chevron-left"
        aria-label="Previous Challenge"
        to={`/workspace/${slug}`}
        {...props}
      />
    </Tooltip>
  );
});

export const NextChallengeIconButton = connect((state: ReduxStoreState) => {
  const { next } = Modules.selectors.challenges.nextPrevChallenges(state);
  return {
    slug: next ? getChallengeSlug(next) : null,
  };
})(({ slug, ...props }: ChallengeButtonProps) => {
  const tooltipMessage = slug
    ? "Next Challenge"
    : "Already at the last challenge";
  return (
    <Tooltip content={tooltipMessage}>
      <IconNavLink
        disabled={!slug}
        icon="chevron-right"
        aria-label="Next Challenge"
        to={`/workspace/${slug}`}
        {...props}
      />
    </Tooltip>
  );
});

export const NextChallengeButton = ({
  slug,
  ...props
}: ChallengeButtonProps) => {
  return (
    <IconNavLink
      disabled={!slug}
      icon="chevron-right"
      aria-label="Next Challenge"
      beforeText="Next Challenge"
      id="workspace-next-challenge-button"
      to={`/workspace/${slug}`}
      {...props}
    />
  );
};

const cardMapStateToProps = (state: ReduxStoreState) => ({
  challenge: Modules.selectors.challenges.getCurrentChallenge(state),
  nextChallenge: Modules.selectors.challenges.nextPrevChallenges(state).next,
  feedbackDialogOpen: Modules.selectors.feedback.getFeedbackDialogOpen(state),
  isCurrentChallengeComplete: Modules.selectors.challenges.isCurrentChallengeComplete(
    state,
  ),
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
  isCurrentChallengeComplete: state.isCurrentChallengeComplete,
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
    isCurrentChallengeComplete,
  }: ReturnType<typeof cardMergeProps>) => {
    const complete = isCurrentChallengeComplete;

    // Render text depending on challenge status
    const text = complete ? "You just completed: " : "In Progress: ";

    return (
      <Card>
        <Upper
          intent="none"
          icon={complete ? "tick" : "info-sign"}
          className={complete ? "challenge-content-success" : ""}
        >
          <Horizontal>
            <p style={{ marginRight: 10 }}>{text}</p>
            <H5>{challenge?.title}</H5>
          </Horizontal>
          <Button
            intent="none"
            icon="comment"
            aria-label="open/close feedback dialog"
            onClick={toggleFeedbackDialogOpen}
          >
            Feedback
          </Button>
        </Upper>
        {nextChallenge && (
          <>
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
              slug={getChallengeSlug(nextChallenge)}
              className={Classes.INTENT_SUCCESS}
            />
          </>
        )}
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
