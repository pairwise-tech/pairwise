import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import { ReduxStoreState } from "modules/root";
import { PageContainer } from "./AdminComponents";

/** ===========================================================================
 * Home Component
 * ============================================================================
 */

class AdminFeedbackPage extends React.Component<IProps, {}> {
  render(): Nullable<JSX.Element> {
    return (
      <PageContainer>
        <Title>Feedback</Title>
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

const mapStateToProps = (state: ReduxStoreState) => ({});

const dispatchProps = {};

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

type IProps = ConnectProps;

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default withProps(AdminFeedbackPage);
