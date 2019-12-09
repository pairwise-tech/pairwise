import React from "react";
import { Provider as ReduxProvider } from "react-redux";
import { Router as ReactRouter } from "react-router-dom";

import ParentContainer from "components/ApplicationContainer";
import store, { history } from "modules/create-store";

/** ===========================================================================
 * App
 * ============================================================================
 */

class App extends React.Component {
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
