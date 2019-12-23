import { Modal } from "@material-ui/core";
import React from "react";
import FacebookLogin from "react-facebook-login";
import { connect } from "react-redux";
import styled from "styled-components";

import Modules, { ReduxStoreState } from "modules/root";
import { COLORS } from "tools/constants";
import { composeWithProps } from "tools/utils";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface IState {}

/** ===========================================================================
 * React Component
 * ----------------------------------------------------------------------------
 * - This component renders a modal which provides and handles SSO options
 * for the application. Facebook is currently supported, Google and GitHub
 * SSO can be added to this component in the future.
 * ============================================================================
 */

class SingleSignOnHandler extends React.Component<IProps, IState> {
  render(): JSX.Element {
    return (
      <Modal
        aria-labelledby="simple-modal-title"
        aria-describedby="simple-modal-description"
        open={this.props.dialogOpen}
        onClose={() => this.setAccountModalState(false)}
      >
        <AccountModal>
          <CreateAccountText>Login/Create Account</CreateAccountText>
          <FacebookLogin
            appId="445906999653380"
            fields="name,email,picture"
            buttonStyle={{ padding: 6 }}
            containerStyle={{ marginTop: 18 }}
            callback={this.handleFacebookResponse}
          />
        </AccountModal>
      </Modal>
    );
  }

  handleFacebookResponse = async (response: any) => {
    try {
      this.props.facebookLoginCallback(response);
    } catch (err) {
      this.props.facebookLoginFailure();
    }
  };

  setAccountModalState = (state: boolean) => {
    this.props.setSingleSignOnDialogState(state);
  };
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const AccountModal = styled.div`
  width: 525px;
  padding: 32px;
  left: 50%;
  top: 50%;
  outline: none;
  position: absolute;
  background: black;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  transform: translate(-50%, -50%);
  border-radius: 3px;
  border: 1px solid ${COLORS.PRIMARY_BLUE};
  background-color: ${COLORS.BACKGROUND_MODAL};
`;

export const CreateAccountText = styled.h1`
  margin-right: 12px;
  margin-left: 12px;
  font-size: 18px;
  font-weight: 200;
  color: ${COLORS.TEXT_TITLE};
  font-family: Helvetica Neue, Lato, sans-serif;

  :hover {
    cursor: pointer;
    color: ${COLORS.TEXT_HOVER};
  }
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  dialogOpen: Modules.selectors.app.singleSignOnDialogState(state),
});

const dispatchProps = {
  facebookLoginCallback: Modules.actions.app.facebookLogin,
  facebookLoginFailure: Modules.actions.app.facebookLoginFailure,
  setSingleSignOnDialogState: Modules.actions.app.setSingleSignOnDialogState,
};

interface ComponentProps {}

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

interface IProps extends ComponentProps, ConnectProps {}

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default composeWithProps<ComponentProps>(withProps)(SingleSignOnHandler);
