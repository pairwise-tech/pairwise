import React from "react";

import Workspace from "./components/Workspace";

import challenges from "./challenges/01_programming_fundamental.json";

console.log(challenges);

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface IState {
  selectedChallengeUuid: Nullable<string>;
}

export interface Challenge {
  uuid: string;
  title: string;
  content: string;
  starterCode: string;
  solutionCode: string;
  testCode: string;
}

/** ===========================================================================
 * App
 * ============================================================================
 */

class App extends React.Component<{}, IState> {
  constructor(props: {}) {
    super(props);

    this.state = {
      selectedChallengeUuid: "",
    };
  }

  render(): JSX.Element {
    return <Workspace />;
  }

  selectedChallengeById = (id: string) => {
    // implement
  };
}

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default App;
