import { Alert, Intent } from "@blueprintjs/core";
import styled from "styled-components/macro";
import { connect } from "react-redux";
import React from "react";
import Modules, { ReduxStoreState } from "../modules/root";
import { constructDataBlobFromChallenge } from "../tools/utils";
import { COLORS, SANDBOX_ID } from "../tools/constants";

/** ===========================================================================
 * React Component
 * ============================================================================
 */

class DeepLinkCodeStringAlert extends React.Component<IProps, {}> {
  render() {
    const { deepLinkCodeString } = this.props;
    const displayAlert = deepLinkCodeString !== null;
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
          <p>We found the following code string the url you opened:</p>
          <CodeStringPreviewBox>{deepLinkCodeString}</CodeStringPreviewBox>
          <p>Do you want to load this into the current challenge workspace?</p>
          <p>
            Be sure you trust the source of the link. This will replace the
            current code in the editor.
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
    const { challenge, deepLinkCodeString, deepLinkSandboxChallengeType } =
      this.props;

    // Update the current challenge, replacing the code with the deep link
    // code string. This update code is copied from the Workspace.
    if (challenge && deepLinkCodeString) {
      // Update the sandbox challenge type, if a challenge type was provided
      // in the deep link.
      if (deepLinkSandboxChallengeType && challenge.id === SANDBOX_ID) {
        this.props.updateChallenge({
          id: challenge.id,
          challenge: { type: deepLinkSandboxChallengeType },
        });
      }

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
    this.props.setDeepLinkCodeString({
      codeString: null,
      sandboxChallengeType: null,
    });
  };
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const CodeStringPreviewBox = styled.pre`
  padding: 2px;
  border-radius: 3px;
  max-width: 300px;
  max-height: 225px;
  overflow: scroll;
  font-size: 10px;
  color: ${COLORS.TEXT_GRAY};
  background: ${COLORS.BACKGROUND_MODAL_DARK};
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  challenge: Modules.selectors.challenges.getCurrentChallenge(state),
  deepLinkCodeString: Modules.selectors.challenges.deepLinkCodeString(state),
  deepLinkSandboxChallengeType:
    Modules.selectors.challenges.deepLinkSandboxChallengeType(state),
});

const dispatchProps = {
  setDeepLinkCodeString: Modules.actions.challenges.setDeepLinkCodeString,
  updateChallenge: Modules.actions.challenges.updateChallenge,
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
