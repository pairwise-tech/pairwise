import { Dialog, Classes } from "@blueprintjs/core";
import React from "react";
import { connect } from "react-redux";
import Modules, { ReduxStoreState } from "modules/root";
import { composeWithProps } from "../tools/admin-utils";
import { Challenge } from "@pairwise/common";
import {
  DataCard,
  KeyValue,
  BreakLine,
  LabelRow,
  ExternalLink,
} from "./AdminComponents";

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
      challengeMap,
      challengeDetailId,
      setChallengeDetailId,
    } = this.props;

    if (!challengeMap || !challengeDetailId) {
      return null;
    }

    const result = challengeMap[challengeDetailId];

    return (
      <Dialog
        className={Classes.DARK}
        isOpen={challengeDetailId !== null}
        onClose={() => {
          setChallengeDetailId(null);
        }}
      >
        {result ? (
          <ChallengeContextCard {...result} />
        ) : (
          <p>
            A challenge could not be found with this id:{" "}
            <i>{challengeDetailId}</i>
          </p>
        )}
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
}

export const ChallengeContextCard = (props: ChallengeContextCardProps) => {
  const { challenge, courseId, moduleId } = props;
  return (
    <DataCard key={challenge.id}>
      <KeyValue label="Challenge Type" value={challenge.type} />
      <KeyValue label="Title" value={challenge.title} />
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
      <LabelRow>
        <ExternalLink link={`http://localhost:3000/workspace/${challenge.id}`}>
          Open Challenge in Codepress
        </ExternalLink>
      </LabelRow>
    </DataCard>
  );
};

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  challengeMap: Modules.selectors.challenges.getChallengeMap(state),
  challengeDetailId: Modules.selectors.challenges.challengeDetailId(state),
});

const dispatchProps = {
  setChallengeDetailId: Modules.actions.challenges.setChallengeDetailId,
};

interface ComponentProps {}

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
