import { Dialog, Classes, Button } from "@blueprintjs/core";
import React from "react";
import { connect } from "react-redux";
import Modules, { ReduxStoreState } from "modules/root";
import { composeWithProps } from "../tools/admin-utils";
import { Challenge, ChallengeMeta } from "@pairwise/common";
import {
  DataCard,
  KeyValue,
  BreakLine,
  LabelRow,
  ExternalLink,
} from "./AdminComponents";
import { COLORS } from "../tools/constants";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface IState {}

/** ===========================================================================
 * React Component
 * ============================================================================
 */

class AdminChallengeDetailModal extends React.Component<IProps, IState> {
  render(): Nullable<JSX.Element> {
    const {
      isMobile,
      challengeMap,
      challengeMeta,
      challengeDetailId,
      setChallengeDetailId,
    } = this.props;

    if (!challengeMap || !challengeDetailId) {
      return null;
    }

    const result = challengeMap[challengeDetailId];

    return (
      <Dialog
        style={{
          padding: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: isMobile ? "100%" : 900,
          background: COLORS.BACKGROUND_LOWER_SECTION,
        }}
        usePortal
        className={Classes.DARK}
        isOpen={challengeDetailId !== null}
        onClose={() => {
          setChallengeDetailId(null);
        }}
      >
        {result ? (
          <ChallengeContextCard
            {...result}
            isMobile={isMobile}
            challengeMeta={challengeMeta}
          />
        ) : (
          <p>
            A challenge could not be found with this id:{" "}
            <i>{challengeDetailId}</i>
          </p>
        )}
        <Button
          style={{ marginTop: 24 }}
          onClick={() => setChallengeDetailId(null)}
        >
          Close Challenge Context
        </Button>
      </Dialog>
    );
  }
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

interface ChallengeContextCardProps {
  courseId: string;
  moduleId: string;
  challenge: Challenge;
  isMobile: boolean;
  challengeMeta: Nullable<ChallengeMeta>;
}

export const ChallengeContextCard = (props: ChallengeContextCardProps) => {
  const { challenge, courseId, moduleId, isMobile, challengeMeta } = props;

  let numberOfTimeCompleted = null;
  if (challengeMeta && challengeMeta.challengeId === challenge.id) {
    numberOfTimeCompleted = challengeMeta.numberOfTimesCompleted;
  }

  return (
    <DataCard key={challenge.id}>
      <KeyValue label="Title" value={challenge.title} />
      <KeyValue label="Challenge Type" value={challenge.type} />
      <KeyValue
        label="Instructions"
        value={challenge.instructions}
        renderAsMarkdown
      />
      <KeyValue label="Content" value={challenge.content} renderAsMarkdown />
      <KeyValue label="challengeId" value={challenge.id} code allowCopy />
      <KeyValue label="moduleId" value={moduleId} code allowCopy />
      <KeyValue label="courseId" value={courseId} code allowCopy />
      <BreakLine />
      <LabelRow>
        <ExternalLink
          link={`https://app.pairwise.tech/workspace/${challenge.id}`}
        >
          Open Challenge in Pairwise
        </ExternalLink>
      </LabelRow>
      {!isMobile && (
        <LabelRow>
          <ExternalLink
            link={`http://localhost:3000/workspace/${challenge.id}`}
          >
            Open Challenge in Codepress
          </ExternalLink>
        </LabelRow>
      )}
      {!numberOfTimeCompleted !== null && (
        <LabelRow style={{ marginTop: 8 }}>
          This challenge has been completed {numberOfTimeCompleted} times.
        </LabelRow>
      )}
    </DataCard>
  );
};

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  challengeMeta: Modules.selectors.challenges.challengeMeta(state),
  challengeMap: Modules.selectors.challenges.getChallengeMap(state),
  challengeDetailId: Modules.selectors.challenges.challengeDetailId(state),
});

const dispatchProps = {
  setChallengeDetailId: Modules.actions.challenges.setChallengeDetailId,
};

interface ComponentProps {
  isMobile: boolean;
}

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

interface IProps extends ComponentProps, ConnectProps {}

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default composeWithProps<ComponentProps>(withProps)(
  AdminChallengeDetailModal,
);
