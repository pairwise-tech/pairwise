import React from "react";
import { Provider as ReduxProvider } from "react-redux";
import { Router as ReactRouter } from "react-router-dom";
import ApplicationContainer from "components/ApplicationContainer";
import store, { exposeGlobals, history } from "modules/create-store";
import { NODE_ENV } from "tools/client-env";
import ScrollToTop from "components/ScrollToTop";
import { DarkTheme } from "components/Shared";

/** ===========================================================================
 * Pairwise App!
 * ============================================================================
 */

class Pairwise extends React.Component {
  componentDidMount() {
    if (NODE_ENV === "development") {
      exposeGlobals();
    }
  }

  render(): JSX.Element {
    return (
      <ReduxProvider store={store}>
        <ReactRouter history={history}>
          <ScrollToTop />
          <DarkTheme>
            <ApplicationContainer />
          </DarkTheme>
        </ReactRouter>
      </ReduxProvider>
    );
  }
}

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default Pairwise;
