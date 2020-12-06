import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import { ReduxStoreState } from "modules/root";
import { PageContainer } from "./AdminComponents";
import PairwiseLogo from "../icons/logo-square@1024.png";

/** ===========================================================================
 * Home Component
 * ============================================================================
 */

class Index extends React.Component<IProps, {}> {
  render(): Nullable<JSX.Element> {
    return (
      <PageContainer>
        <ContentContainer>
          <Logo src={PairwiseLogo} alt="Pairwise Logo" />
          <Title>Pairwise Admin</Title>
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
  padding-top: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
`;

const Title = styled.code`
  margin-top: 16px;
  font-size: 16px;
`;

const Logo = styled.img`
  width: 225px;
  height: 225px;
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

export default withProps(Index);
