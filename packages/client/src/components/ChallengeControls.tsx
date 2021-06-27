import React from "react";
import { connect } from "react-redux";
import { Classes, Card, H5, Button, Callout } from "@blueprintjs/core";
import { Tooltip2 } from "@blueprintjs/popover2";
import { IconNavLink } from "./SharedComponents";
import Modules, { ReduxStoreState } from "modules/root";
import styled from "styled-components/macro";
import { getChallengeSlug } from "@pairwise/common";
import { MOBILE } from "tools/constants";
import { getDimensions } from "tools/dimensions";
import { FEEDBACK_DIALOG_TYPES } from "modules/feedback/actions";

interface ChallengeButtonProps {
  slug: string | null;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  fill?: boolean;
  large?: boolean;
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
    <Tooltip2 content={tooltipMessage}>
      <IconNavLink
        disabled={!slug}
        icon="chevron-left"
        aria-label="Previous Challenge"
        to={`/workspace/${slug}`}
        {...props}
      />
    </Tooltip2>
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
    <Tooltip2 content={tooltipMessage}>
      <IconNavLink
        disabled={!slug}
        icon="chevron-right"
        aria-label="Next Challenge"
        to={`/workspace/${slug}`}
        {...props}
      />
    </Tooltip2>
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
  isCurrentChallengeComplete:
    Modules.selectors.challenges.isCurrentChallengeComplete(state),
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
  openFeedbackDialog: (e: React.MouseEvent) => {
    e.preventDefault();
    methods.setFeedbackDialogState(FEEDBACK_DIALOG_TYPES.CHALLENGE_FEEDBACK);
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
    openFeedbackDialog,
    isCurrentChallengeComplete,
  }: ReturnType<typeof cardMergeProps>) => {
    const complete = isCurrentChallengeComplete;

    // Render text depending on challenge status
    const text = complete ? "You completed: " : "In Progress: ";
    const isMobile = getDimensions().w < 700;

    return (
      <Card>
        <Upper
          intent="none"
          icon={complete ? "tick" : "info-sign"}
          id={complete ? "challenge-content-success" : ""}
          className={complete ? "challenge-content-success" : ""}
        >
          <Horizontal>
            <p style={{ marginRight: 10 }}>{text}</p>
            <H5>{challenge?.title}</H5>
          </Horizontal>
          <Button
            className="feedback-button"
            large={isMobile}
            intent="none"
            icon="comment"
            aria-label="open the feedback dialog"
            onClick={openFeedbackDialog}
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
              fill={isMobile}
              large={isMobile}
              slug={getChallengeSlug(nextChallenge)}
              className={Classes.INTENT_SUCCESS}
              style={{
                marginBottom: isMobile ? 20 : 0,
              }}
            />
            <MobileOnly>
              <Button
                fill
                className="feedback-button"
                large={isMobile}
                intent="none"
                icon="comment"
                aria-label="open the feedback dialog"
                onClick={openFeedbackDialog}
              >
                Feedback
              </Button>
            </MobileOnly>
          </>
        )}
      </Card>
    );
  },
);

const MobileOnly = styled.div`
  display: none;
  @media ${MOBILE} {
    display: block;
  }
`;

const Horizontal = styled.div`
  display: flex;
  align-items: center;
  & > * {
    margin-top: 0;
    margin-bottom: 0;
  }

  @media ${MOBILE} {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const Upper = styled(Callout)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px;
  margin-bottom: 20px;

  @media ${MOBILE} {
    flex-direction: column;
    align-items: flex-start;

    .feedback-button {
      display: none;
    }
  }
`;
