import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import { ReduxStoreState } from "modules/root";
import { PageContainer, PageTitle } from "./Shared";
import { PROSE_MAX_WIDTH } from "tools/constants";
import SEO from "./SEO";

/** ===========================================================================
 * Home Component
 * ============================================================================
 */

class Home extends React.Component<IProps, {}> {
  render(): Nullable<JSX.Element> {
    return (
      <PageContainer>
        <SEO
          title="Welcome to Pairwise"
          description="Learn to code with hands-on challenges and projects"
        />
        <ContentContainer>
          <PageTitle>Welcome to the Pairwise Admin UI!</PageTitle>
        </ContentContainer>
      </PageContainer>
    );
  }
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const ContentContainer = styled.div`
  max-width: ${PROSE_MAX_WIDTH - 325}px;
  margin-bottom: 24px;

  p {
    font-size: 18px;
  }
`;

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

export default withProps(Home);
