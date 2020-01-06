import React from "react";
import { Provider as ReduxProvider } from "react-redux";
import { Router as ReactRouter } from "react-router-dom";

import ParentContainer from "components/ApplicationContainer";
import store, { exposeGlobals, history } from "modules/create-store";
import { NODE_ENV } from "tools/client-env";
import { COLORS } from "tools/constants";

/** ===========================================================================
 * App
 * ============================================================================
 */

const muiTheme = {
  palette: {
    type: "dark",
    primary: { main: COLORS.PRIMARY_GREEN }, // Green
    secondary: { main: COLORS.SECONDARY_PINK }, // Pink-ish
  },
};

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
