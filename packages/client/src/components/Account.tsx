import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import { Classes, Button } from "@blueprintjs/core";

import Modules, { ReduxStoreState } from "modules/root";
import { PageContainer, Text, PageTitle } from "./shared";
import { COLORS } from "tools/constants";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface IState {
  givenName: string;
  familyName: string;
  displayName: string;
  edit: boolean;
}

/** ===========================================================================
 * App
 * ============================================================================
 */

class Profile extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.state = {
      givenName: "",
      familyName: "",
      displayName: "",
      edit: false,
    };
  }

  componentWillReceiveProps(nextProps: IProps) {
    if (nextProps.user !== this.props.user) {
      this.handleDiscardChanges();
    }
  }

  render(): Nullable<JSX.Element> {
    const { edit } = this.state;
    const { user } = this.props;
    if (!user) {
      return null;
    }

    const { profile } = user;
    return (
      <PageContainer>
        <PageTitle>Account</PageTitle>
        <TextItem>
          <b>Given Name:</b> {profile.givenName}
        </TextItem>
        {edit && (
          <InputField
            type="text"
            placeholder="Enter your given name"
            className={Classes.INPUT}
            value={this.state.givenName}
            onChange={event => this.setState({ givenName: event.target.value })}
          />
        )}
        <TextItem>
          <b>Family Name:</b> {profile.familyName}
        </TextItem>
        {edit && (
          <InputField
            type="text"
            placeholder="Enter your family name"
            className={Classes.INPUT}
            value={this.state.familyName}
            onChange={event =>
              this.setState({ familyName: event.target.value })
            }
          />
        )}
        <TextItem>
          <b>Display Name:</b> {profile.displayName}
        </TextItem>
        {edit && (
          <InputField
            type="text"
            placeholder="Enter a display name"
            className={Classes.INPUT}
            value={this.state.displayName}
            onChange={event =>
              this.setState({ displayName: event.target.value })
            }
          />
        )}
        <TextItem>
          <b>Email:</b> {profile.email}
        </TextItem>
        {edit && (
          <InputField
            disabled
            type="text"
            className={Classes.INPUT}
            value={profile.email}
            onChange={() => null}
          />
        )}
        {edit && (
          <TextItem style={{ fontSize: 12 }}>
            (Your email is linked to your 3rd party signin account and cannot be
            changed)
          </TextItem>
        )}
        {edit ? (
          <Controls>
            <Button
              intent="primary"
              text="Save Profile"
              onClick={this.handleSaveChanges}
              style={{ marginRight: 8, color: COLORS.TEXT_DARK }}
            />
            <Button text="Cancel" onClick={this.handleDiscardChanges} />
          </Controls>
        ) : (
          <Controls>
            <Button
              onClick={this.handleEditProfile}
              text="Edit Profile Information"
            />
          </Controls>
        )}
      </PageContainer>
    );
  }

  handleEditProfile = () => {
    const { user } = this.props;
    if (user) {
      const { profile } = user;

      this.setState({
        edit: true,
        givenName: profile.givenName,
        familyName: profile.familyName,
        displayName: profile.displayName,
      });
    }
  };

  handleSaveChanges = () => {
    const userDetails = {
      givenName: this.state.givenName,
      familyName: this.state.familyName,
      displayName: this.state.displayName,
    };
    this.props.updateUser(userDetails);
  };

  handleDiscardChanges = () => {
    this.setState({ edit: false });
  };
}

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const TextItem = styled(Text)`
  margin-top: 12px;
`;

const InputField = styled.input`
  margin-top: 12px;
  width: 200px;
  color: ${COLORS.TEXT_HOVER} !important;
  background: ${COLORS.BACKGROUND_CONSOLE} !important;
`;

const Controls = styled.div`
  margin-top: 24px;
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  user: Modules.selectors.user.userSelector(state),
});

const dispatchProps = {
  initializeApp: Modules.actions.app.initializeApp,
  updateUser: Modules.actions.user.updateUser,
};

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

type IProps = ConnectProps;

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default withProps(Profile);
