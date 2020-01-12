import React from "react";
import { connect } from "react-redux";
import { Tooltip, Callout, Classes } from "@blueprintjs/core";
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
      to={`/workspace/${challengeId}`}
      {...props}
    />
  );
};

const mapCalloutState = (state: ReduxStoreState) => ({
  challenge: Modules.selectors.challenges.nextPrevChallenges(state).next,
});

export const NextChallengeCallout = connect(mapCalloutState)(
  ({ challenge }: ReturnType<typeof mapCalloutState>) => {
    return (
      <Callout title="Up Next">
        {challenge ? (
          <p>{challenge.title}</p>
        ) : (
          <p>You're on the last challenge!</p>
        )}
        <NextChallengeButton
          challengeId={challenge?.id}
          className={Classes.INTENT_SUCCESS}
        />
      </Callout>
    );
  },
);
