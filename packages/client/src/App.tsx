import React from "react";
import { Provider as ReduxProvider } from "react-redux";
import { Router as ReactRouter } from "react-router-dom";

import ParentContainer from "components/ApplicationContainer";
import store, { exposeGlobals, history } from "modules/create-store";
import { NODE_ENV } from "tools/client-env";

/** ===========================================================================
 * App
 * ============================================================================
 */

class App extends React.Component {
  componentDidMount() {
    if (NODE_ENV === "development") {
      exposeGlobals();
    }
  }

  render(): JSX.Element {
    return (
      <ReduxProvider store={store}>
        <ReactRouter history={history}>
          <ParentContainer />
        </ReactRouter>
      </ReduxProvider>
    );
  }
}

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default App;
