import queryString from "query-string";
import React from "react";
import { connect } from "react-redux";
import { Redirect, Route, Switch } from "react-router";

import Modules from "modules/root";
import Workspace from "./Workspace";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface IState {
  hasHandledRedirect: boolean;
}

/** ===========================================================================
 * App
 * ============================================================================
 */

class ApplicationContainer extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.state = {
      hasHandledRedirect: false,
    };
  }

  componentDidMount() {
    this.props.initializeApp();

    const { accessToken } = queryString.parse(window.location.search);
    if (typeof accessToken === "string" && Boolean(accessToken)) {
      this.props.storeAccessToken({ accessToken });
    }

    this.setState({ hasHandledRedirect: true });
  }

  render(): Nullable<JSX.Element> {
    if (!this.state.hasHandledRedirect) {
      return null;
    }

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
  storeAccessToken: Modules.actions.auth.storeAccessToken,
};

type ConnectProps = typeof dispatchProps;

type IProps = ConnectProps;

const withProps = connect(null, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default withProps(ApplicationContainer);
