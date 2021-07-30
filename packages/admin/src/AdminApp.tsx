import React, { ErrorInfo } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { Router as ReactRouter } from "react-router-dom";
import AdminContainer from "components/AdminContainer";
import store, { exposeGlobals, history } from "modules/create-store";
import { NODE_ENV } from "tools/admin-env";
import { FullScreenOverlay, OverlayText } from "components/AdminComponents";
import AdminThemeContainer from "./components/AdminThemeContainer";

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

class PairwiseAdminApp extends React.Component<IProps, IState> {
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
          <AdminThemeContainer>
            <AdminContainer />
          </AdminThemeContainer>
        </ReactRouter>
      </ReduxProvider>
    );
  }
}

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default PairwiseAdminApp;
