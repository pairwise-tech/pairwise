import { Alert, Intent } from "@blueprintjs/core";
import { connect } from "react-redux";
import React from "react";
import Modules, { ReduxStoreState } from "../modules/root";
import { constructDataBlobFromChallenge } from "../tools/utils";

/** ===========================================================================
 * React Component
 * ============================================================================
 */

class DeepLinkCodeStringAlert extends React.Component<IProps, {}> {
  render() {
    const displayAlert = this.props.deepLinkCodeString !== null;
    return (
      <>
        <Alert
          icon="code"
          canEscapeKeyCancel
          canOutsideClickCancel
          className="bp3-dark"
          isOpen={displayAlert}
          cancelButtonText="Cancel"
          intent={Intent.WARNING}
          onCancel={this.handleCancel}
          onConfirm={this.handleConfirm}
          confirmButtonText="Load Code"
        >
          <p>
            We found a code string in your url. Do you want to load this into
            the current challenge workspace? Be sure you trust the source of the
            link. This will replace the current code in the editor.
          </p>
        </Alert>
      </>
    );
  }

  handleCancel = () => {
    // Clear the existing code string
    this.clearCodeString();
  };

  handleConfirm = () => {
    const { challenge, deepLinkCodeString } = this.props;
    // Update the current challenge, replacing the code with the deep link
    // code string
    if (challenge && deepLinkCodeString) {
      const blob = constructDataBlobFromChallenge({
        code: deepLinkCodeString,
        challenge,
      });

      this.props.updateCurrentChallengeBlob({
        dataBlob: blob,
        challengeId: challenge.id,
      });

      // Then clear the code string
      this.clearCodeString();
    }
  };

  clearCodeString = () => {
    this.props.setDeepLinkCodeString(null);
  };
}

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  challenge: Modules.selectors.challenges.getCurrentChallenge(state),
  deepLinkCodeString: Modules.selectors.challenges.deepLinkCodeString(state),
});

const dispatchProps = {
  setDeepLinkCodeString: Modules.actions.challenges.setDeepLinkCodeString,
  updateCurrentChallengeBlob:
    Modules.actions.challenges.updateCurrentChallengeBlob,
};

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

type IProps = ConnectProps;

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default withProps(DeepLinkCodeStringAlert);
