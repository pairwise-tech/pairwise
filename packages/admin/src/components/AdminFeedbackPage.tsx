import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import Modules, { ReduxStoreState } from "modules/root";
import { PageContainer, JsonComponent } from "./AdminComponents";

/** ===========================================================================
 * Home Component
 * ============================================================================
 */

class AdminFeedbackPage extends React.Component<IProps, {}> {
  render(): Nullable<JSX.Element> {
    return (
      <PageContainer>
        <Title>Feedback</Title>
        <JsonComponent data={this.props.feedbackRecords} />
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
