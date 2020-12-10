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
import { Button } from "@blueprintjs/core";
import { Link } from "react-router-dom";

/** ===========================================================================
 * Home Component
 * ============================================================================
 */

class AdminFeedbackPage extends React.Component<IProps, {}> {
  render(): Nullable<JSX.Element> {
    const { feedbackRecords, deleteFeedbackByUuid } = this.props;
    return (
      <PageContainer>
        <Title>Feedback</Title>
        <SummaryText>
          There are a total of {feedbackRecords.length} feedback records
          submitted.
        </SummaryText>
        {feedbackRecords.map(feedback => {
          const { user } = feedback;
          const email = user?.email;
          return (
            <DataCard key={feedback.uuid}>
              <KeyValue label="Type" value={feedback.type} />
              <KeyValue
                code
                isChallengeId
                label="ChallengeId"
                value={feedback.challengeId}
              />
              <KeyValue label="Feedback" value={feedback.feedback} />
              <KeyValue
                allowCopy
                label="Feedback Author"
                value={email ? email : "Anonymous"}
              />
              <KeyValue
                allowCopy
                code={!!user}
                label="Author uuid"
                value={user ? user.uuid : "n/a"}
              />
              <KeyValue
                label="createdAt"
                value={new Date(feedback.createdAt).toDateString()}
              />
              <Button
                intent="danger"
                style={{ marginTop: 6 }}
                onClick={() => deleteFeedbackByUuid(feedback.uuid)}
              >
                Delete Feedback Record
              </Button>
              {user && (
                <Link to={`/search/${user.uuid}`}>
                  <Button style={{ marginTop: 6, marginLeft: 12 }}>
                    View Feedback Author
                  </Button>
                </Link>
              )}
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

const dispatchProps = {
  deleteFeedbackByUuid: Modules.actions.feedback.deleteFeedbackByUuid,
};

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

type IProps = ConnectProps;

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default withProps(AdminFeedbackPage);
