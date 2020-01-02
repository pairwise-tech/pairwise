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

class Profile extends React.Component<IProps, IState> {
  render(): Nullable<JSX.Element> {
    const { user } = this.props;
    if (!user) {
      return null;
    }

    const { profile } = user;
    return (
      <PageContainer>
        <Text>User Profile:</Text>
        <Text>Name: {profile.displayName}</Text>
        <Text>Email: {profile.email}</Text>
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

const dispatchProps = {
  initializeApp: Modules.actions.app.initializeApp,
};

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

type IProps = ConnectProps;

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default withProps(Profile);
