import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import Modules, { ReduxStoreState } from "modules/root";
import { PageContainer, SummaryText } from "./AdminComponents";
import { RouteComponentProps } from "react-router-dom";
import { parseSearchQuery } from "../tools/admin-utils";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

export interface AdminSearchResult {
  type: "email" | "uuid" | "challengeId";
  value: string;
}

/** ===========================================================================
 * Home Component
 * ============================================================================
 */

class AdminSearchPage extends React.Component<IProps, {}> {
  render(): Nullable<JSX.Element> {
    const params: any = this.props.match.params;
    const result = parseSearchQuery(params.query);
    return (
      <PageContainer>
        <h2>Search Results</h2>
        {result ? (
          <>
            <SummaryText>
              Displaying results for search query: <i>{params.query}</i>
            </SummaryText>
          </>
        ) : (
          <SummaryText>
            <i>{params.query}</i> is an invalid search query.
          </SummaryText>
        )}
      </PageContainer>
    );
  }
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  users: Modules.selectors.users.usersState(state).users,
});

const dispatchProps = {};

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

type IProps = ConnectProps & RouteComponentProps;

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default withProps(AdminSearchPage);
