import { createMuiTheme, ThemeProvider } from "@material-ui/core/styles";
import React from "react";
import { Provider as ReduxProvider } from "react-redux";
import { Router as ReactRouter } from "react-router-dom";

import ParentContainer from "components/ApplicationContainer";
import store, { exposeGlobals, history } from "modules/create-store";

/** ===========================================================================
 * App
 * ============================================================================
 */

const theme = createMuiTheme({
  palette: {
    type: "dark",
    primary: { main: "rgb(0, 255, 185)" }, // Green
    secondary: { main: "#f50057" }, // Pink-ish
  },
});

class App extends React.Component {
  componentDidMount() {
    if (process.env.NODE_ENV === "development") {
      exposeGlobals();
    }
  }

  render(): JSX.Element {
    return (
      <ReduxProvider store={store}>
        <ReactRouter history={history}>
          <ThemeProvider theme={theme}>
            <ParentContainer />
          </ThemeProvider>
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
