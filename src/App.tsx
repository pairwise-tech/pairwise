import React from "react";

import Workspace, { CHALLENGE_TYPE } from "./components/Workspace";

import challenges from "./challenges/01_programming_fundamental.json";

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

class App extends React.Component<{}, IState> {
  constructor(props: {}) {
    super(props);

    this.state = {
      selectedChallengeUuid: "88cfc98e-27bd-4044-b71e-ca947dc596da",
    };
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

export default App;
