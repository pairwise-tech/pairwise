import React from "react";
import { connect } from "react-redux";
import { Tooltip, Classes, Card, H5 } from "@blueprintjs/core";
import { IconNavLink } from "./Shared";
import Modules, { ReduxStoreState } from "modules/root";

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

const mapCardState = (state: ReduxStoreState) => ({
  challenge: Modules.selectors.challenges.nextPrevChallenges(state).next,
});

export const NextChallengeCard = connect(mapCardState)(
  ({ challenge }: ReturnType<typeof mapCardState>) => {
    return (
      <Card>
        <H5 style={{ color: "rgb(110, 217, 173)" }}>Up Next</H5>
        {challenge ? (
          <p>{challenge.title}</p>
        ) : (
          <p>You're on the last challenge!</p>
        )}
        <NextChallengeButton
          challengeId={challenge?.id}
          className={Classes.INTENT_SUCCESS}
        />
      </Card>
    );
  },
);
