import React, { ChangeEvent } from "react";
import { connect } from "react-redux";
import { EditableText, Classes, Button } from "@blueprintjs/core";
import { PROSE_MAX_WIDTH } from "tools/constants";
import { Hr, TitleHeader } from "./Shared";
import { Challenge } from "@pairwise/common";
import { composeWithProps } from "tools/utils";
import Modules, { ReduxStoreState } from "modules/root";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface IState {
  projectURL: string;
  repoURL: string;
}

/** ===========================================================================
 * React Component
 * ============================================================================
 */

class ProjectSubmission extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.state = {
      projectURL: "",
      repoURL: "",
    };
  }

  componentDidMount() {
    const { blob } = this.props;

    // No blob exists until the user submits project information
    if (!blob) {
      return;
    }
  }

  render(): JSX.Element {
    const { projectURL, repoURL } = this.state;
    return (
      <div style={{ maxWidth: PROSE_MAX_WIDTH }}>
        <Hr style={{ marginTop: 40, marginBottom: 20 }} />
        <TitleHeader>
          <EditableText
            disabled
            multiline
            value="Project Submission"
            onChange={() => console.warn("Should not happen")}
          />
        </TitleHeader>
        <p>
          Submit your project details here. Enter the GitHub repository URL and
          a URL for the deployed project, if applicable.
        </p>
        <input
          type="url"
          value={repoURL}
          onChange={this.handleUpdateRepoURL}
          placeholder="GitHub Repository URL"
          style={{ marginTop: 12, width: "100%" }}
          className={Classes.INPUT}
        />
        <input
          type="url"
          value={projectURL}
          onChange={this.handleUpdateProjectURL}
          placeholder="Deployed Project URL (optional)"
          style={{ marginTop: 12, width: "100%" }}
          className={Classes.INPUT}
        />
        <Button
          intent="primary"
          style={{ marginTop: 24 }}
          onClick={this.handleSaveProjectDetails}
        >
          Save Project Information
        </Button>
      </div>
    );
  }

  handleUpdateRepoURL = (e: ChangeEvent<HTMLInputElement>) => {
    this.setState({ repoURL: e.target.value });
  };

  handleUpdateProjectURL = (e: ChangeEvent<HTMLInputElement>) => {
    this.setState({ projectURL: e.target.value });
  };

  handleSaveProjectDetails = () => {
    const { projectURL, repoURL } = this.state;
    console.log("Repo: ", repoURL);
    console.log("Project: ", projectURL);
  };
}

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  blob: Modules.selectors.challenges.getBlobForCurrentChallenge(state),
});

const dispatchProps = {
  updateChallenge: Modules.actions.challenges.updateChallenge,
};

type ProjectSubmissionProps = ReturnType<typeof mapStateToProps> &
  typeof dispatchProps;

interface ComponentProps {
  challenge: Challenge;
}

interface IProps extends ProjectSubmissionProps, ComponentProps {}

const withProps = connect(mapStateToProps, dispatchProps);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default composeWithProps<ComponentProps>(withProps)(ProjectSubmission);
