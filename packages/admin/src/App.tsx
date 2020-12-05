import React, { ErrorInfo } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { Router as ReactRouter } from "react-router-dom";
import ApplicationContainer from "components/ApplicationContainer";
import store, { exposeGlobals, history } from "modules/create-store";
import { NODE_ENV } from "tools/client-env";
import { DarkTheme, FullScreenOverlay, OverlayText } from "components/Shared";

/** ===========================================================================
 * Types
 * ============================================================================
 */

interface IState {
  hasError: boolean;
}

interface IProps {}

/** ===========================================================================
 * Pairwise App!
 * ============================================================================
 */

class Pairwise extends React.Component<IProps, IState> {
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  constructor(props: IProps) {
    super(props);

    this.state = {
      hasError: false,
    };
  }

  componentDidCatch(error: Error, { componentStack }: ErrorInfo) {
    console.error(error);
  }

  componentDidMount() {
    if (NODE_ENV === "development") {
      exposeGlobals();
    }
  }

  renderErrorOverlay = () => {
    return (
      <FullScreenOverlay>
        <div>
          <OverlayText>Uh oh... Something went wrong.</OverlayText>
        </div>
      </FullScreenOverlay>
    );
  };

  render(): JSX.Element {
    if (this.state.hasError) {
      return this.renderErrorOverlay();
    }

    return (
      <ReduxProvider store={store}>
        <ReactRouter history={history}>
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
