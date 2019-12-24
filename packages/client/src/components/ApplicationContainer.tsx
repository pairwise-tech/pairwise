import React from "react";
import { connect } from "react-redux";
import { Redirect, Route, Switch } from "react-router";

import Modules from "modules/root";
import Workspace from "./Workspace";

/** ===========================================================================
 * App
 * ============================================================================
 */

class ApplicationContainer extends React.Component<IProps, {}> {
  componentDidMount() {
    this.props.initializeApp();
  }

  render(): JSX.Element {
    return (
      <Switch>
        <Route key={0} path="/workspace/:id" component={Workspace} />
        <Route key={1} component={() => <Redirect to="/workspace" />} />
      </Switch>
    );
  }
}

/** ===========================================================================
 * Props
 * ============================================================================
 */

const dispatchProps = {
  initializeApp: Modules.actions.app.initializeApp,
};

type ConnectProps = typeof dispatchProps;

type IProps = ConnectProps;

const withProps = connect(null, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default withProps(ApplicationContainer);
