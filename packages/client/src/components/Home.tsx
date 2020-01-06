import React from "react";
import { connect } from "react-redux";

import Modules, { ReduxStoreState } from "modules/root";
import { PageContainer, Text } from "./shared";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface IState {}

/** ===========================================================================
 * App
 * ============================================================================
 */

class Home extends React.Component<IProps, IState> {
  render(): Nullable<JSX.Element> {
    return (
      <PageContainer>
        <Text>Pairwise Home</Text>
        <Text>Welcome</Text>
      </PageContainer>
    );
  }
}

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  user: Modules.selectors.user.userSelector(state),
});

const dispatchProps = {};

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

type IProps = ConnectProps;

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default withProps(Home);
