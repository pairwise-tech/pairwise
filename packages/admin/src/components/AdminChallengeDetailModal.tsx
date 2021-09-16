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
  SummaryTitle,
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
      adminUserSettings,
      challengeDetailId,
      setChallengeDetailId,
    } = this.props;

    const isDark = adminUserSettings.appTheme === "dark";

    if (!challengeMap || !challengeDetailId) {
      return null;
    }

    const result = challengeMap[challengeDetailId];

    return (
      <Dialog
        usePortal
        style={{
          padding: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: isMobile ? "100%" : 900,
          background: isDark
            ? COLORS.BACKGROUND_LOWER_SECTION
            : COLORS.BACKGROUND_PAGE_LIGHT,
        }}
        className={isDark ? Classes.DARK : ""}
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

  let numberOfTimesAttempted = null;
  let numberOfTimeCompleted = null;
  if (challengeMeta && challengeMeta.challengeId === challenge.id) {
    numberOfTimesAttempted = challengeMeta.numberOfTimesAttempted;
    numberOfTimeCompleted = challengeMeta.numberOfTimesCompleted;
  }

  const displayChallengeMeta = numberOfTimesAttempted || numberOfTimeCompleted;

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
      <SummaryTitle style={{ fontSize: 22, fontWeight: "bold" }}>
        Challenge Links:
      </SummaryTitle>
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
      {displayChallengeMeta && (
        <>
          <SummaryTitle style={{ fontSize: 22, fontWeight: "bold" }}>
            Challenge Meta Stats:
          </SummaryTitle>
          {challenge.type === "media" ? (
            <LabelRow style={{ marginTop: 8 }}>
              This challenge has been completed {numberOfTimeCompleted || 0}{" "}
              times. These numbers include anonymous and registered users.
            </LabelRow>
          ) : (
            <LabelRow style={{ marginTop: 8 }}>
              This challenge has been attempted {numberOfTimesAttempted || 0}{" "}
              times, and completed {numberOfTimeCompleted || 0} times. These
              numbers include anonymous and registered users.
            </LabelRow>
          )}
        </>
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
  adminUserSettings: Modules.selectors.admin.adminUserSettings(state),
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
