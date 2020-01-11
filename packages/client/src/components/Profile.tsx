import React from "react";
import { connect } from "react-redux";

import Modules, { ReduxStoreState } from "modules/root";
import { PageContainer, Text } from "./shared";
import { Classes, Button } from "@blueprintjs/core";

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

  render(): Nullable<JSX.Element> {
    const { edit } = this.state;
    const { user } = this.props;
    if (!user) {
      return null;
    }

    const { profile } = user;
    return (
      <PageContainer>
        <Text>User Profile:</Text>
        <Text>Given Name: {profile.givenName}</Text>
        {edit && (
          <input
            type="text"
            className={Classes.INPUT}
            value={this.state.givenName}
            onChange={this.createChangeHandler("givenName")}
          />
        )}
        <Text>Family Name: {profile.familyName}</Text>
        {edit && (
          <input
            type="text"
            className={Classes.INPUT}
            value={this.state.familyName}
            onChange={this.createChangeHandler("familyName")}
          />
        )}
        <Text>Display Name: {profile.displayName}</Text>
        {edit && (
          <input
            type="text"
            className={Classes.INPUT}
            value={this.state.displayName}
            onChange={this.createChangeHandler("displayName")}
          />
        )}
        <Text>Email: {profile.email}</Text>
        {edit && (
          <input
            disabled
            type="text"
            className={Classes.INPUT}
            value={profile.email}
            onChange={() => null}
          />
        )}
        {edit && (
          <Text>
            (Your email is linked to your SSO signin account and cannot be
            changed)
          </Text>
        )}
        {edit ? (
          <Button onClick={() => this.setState({ edit: true })} text="Edit" />
        ) : (
          <React.Fragment>
            <Button onClick={this.handleDiscardChanges} text="Discard" />
            <Button
              onClick={() => this.setState({ edit: false })}
              text="Save"
            />
          </React.Fragment>
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
    console.log("Saving");
  };

  handleDiscardChanges = () => {
    this.setState({ edit: true });
  };

  createChangeHandler = (
    stateKey: "givenName" | "familyName" | "displayName",
  ) => (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState(ps => ({ ...ps, [stateKey]: event.target.value }));
  };
}

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  user: Modules.selectors.user.userSelector(state),
});

const dispatchProps = {
  initializeApp: Modules.actions.app.initializeApp,
};

type ConnectProps = ReturnType<typeof mapStateToProps> & typeof dispatchProps;

type IProps = ConnectProps;

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default withProps(Profile);
