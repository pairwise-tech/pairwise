import React from "react";
import { connect } from "react-redux";

import Workspace, { CHALLENGE_TYPE } from "./Workspace";

import Modules from "modules/root";
import challenges from "../challenges/01_programming_fundamental.json";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface IState {
  selectedChallengeUuid: Nullable<string>;
}

export interface Challenge {
  id: string;
  title: string;
  content: string;
  testCode: string;
  starterCode: string;
  solutionCode: string;
  type: CHALLENGE_TYPE;
}

/** ===========================================================================
 * App
 * ============================================================================
 */

class ApplicationContainer extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.state = {
      selectedChallengeUuid: "88cfc98e-27bd-4044-b71e-ca947dc596da",
    };
  }

  componentDidMount() {
    this.props.initializeApp();
  }

  render(): JSX.Element {
    const challenge = this.getCurrentChallenge();
    return <Workspace challenge={challenge} />;
  }

  getCurrentChallenge = () => {
    const result = challenges.challenges.find(
      c => c.id === this.state.selectedChallengeUuid,
    );

    return result as Challenge;
  };

  selectedChallengeById = (id: string) => {
    // implement
  };
}

/** ===========================================================================
 * Export
 * ============================================================================
 */

const dispatchProps = {
  initializeApp: Modules.actions.app.initializeApp,
};

type ConnectProps = typeof dispatchProps;

type IProps = ConnectProps;

const withProps = connect(null, dispatchProps);

export default withProps(ApplicationContainer);
