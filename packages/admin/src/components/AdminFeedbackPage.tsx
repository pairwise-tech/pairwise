import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import Modules, { ReduxStoreState } from "modules/root";
import {
  PageContainer,
  DataCard,
  KeyValue,
  SummaryText,
} from "./AdminComponents";

/** ===========================================================================
 * Home Component
 * ============================================================================
 */

class AdminFeedbackPage extends React.Component<IProps, {}> {
  render(): Nullable<JSX.Element> {
    const { feedbackRecords } = this.props;
    return (
      <PageContainer>
        <Title>Feedback</Title>
        <SummaryText>
          There are a total of {feedbackRecords.length} feedback records
          submitted.
        </SummaryText>
        {feedbackRecords.map(feedback => {
          return (
            <DataCard key={feedback.uuid}>
              <KeyValue label="Type" value={feedback.type} />
              <KeyValue label="ChallengeId" value={feedback.challengeId} />
              <KeyValue label="Feedback" value={feedback.feedback} />
              <KeyValue label="uuid" value={feedback.uuid} code />
              <KeyValue
                label="createdAt"
                value={new Date(feedback.createdAt).toDateString()}
              />
            </DataCard>
          );
        })}
      </PageContainer>
    );
  }
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const Title = styled.h2``;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  feedbackRecords: Modules.selectors.feedback.feedbackRecordsSelector(state),
});

const dispatchProps = {};

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

type IProps = ConnectProps;

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default withProps(AdminFeedbackPage);
