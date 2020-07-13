import React, { ChangeEvent } from "react";
import { connect } from "react-redux";
import { EditableText, Classes, Button } from "@blueprintjs/core";
import { PROSE_MAX_WIDTH } from "tools/constants";
import { Hr, TitleHeader } from "./Shared";
import { Challenge, ProjectChallengeBlob } from "@pairwise/common";
import { composeWithProps, constructDataBlobFromChallenge } from "tools/utils";
import Modules, { ReduxStoreState } from "modules/root";
import toaster from "tools/toast-utils";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface IState {
  projectURL: string;
  repoURL: string;
  error: boolean;
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
      error: false,
    };
  }

  componentDidMount() {
    const { blob } = this.props;

    // No blob exists until the user submits project information
    if (!blob) {
      return;
    }

    // Should not happen, this component should only be rendered if the
    // challenge is a project which means the associated blob should be
    // a project blob
    if (blob.type !== "project") {
      console.error(
        "Project Submission UI received the wrong challenge blob type: ",
        blob.type,
      );
      this.setState({ error: true });
    }

    // Initialize with the stored data from the blob
    const { url, repo } = blob as ProjectChallengeBlob;
    this.setState({
      repoURL: repo,
      projectURL: url,
    });
  }

  render(): Nullable<JSX.Element> {
    const { error, projectURL, repoURL } = this.state;

    if (error) {
      return null;
    }

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
          disabled={!repoURL}
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
    const { challenge, updateCurrentChallengeBlob } = this.props;
    const { projectURL, repoURL } = this.state;

    // Validation
    if (!repoURL) {
      toaster.warn(`A repository URL is required to save project details.`);
      return;
    }
    if (!validateProjectURL(repoURL)) {
      toaster.warn(`Please submit a valid repository url: ${repoURL}`);
      return;
    } else if (!validateProjectURL(projectURL)) {
      toaster.warn(`Please submit a valid project url: ${projectURL}`);
      return;
    }

    const blob = constructDataBlobFromChallenge({
      repoURL,
      projectURL,
      challenge,
    });

    updateCurrentChallengeBlob({
      dataBlob: blob,
      challengeId: challenge.id,
    });

    toaster.success("Project details submitted successfully!");
  };
}

/** ===========================================================================
 * Styles and Utils
 * ============================================================================
 */

/**
 * Validate the url strings. The URL string can be empty or a valid URL.
 */
const validateProjectURL = (url: string) => {
  return !!url ? isValidURL(url) : true;
};

/**
 * Validate a string as a URL.
 */
const isValidURL = (url: string): boolean => {
  try {
    const check = new URL(url);
    return !!check; // i.e. true
  } catch (err) {
    return false;
  }
};

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapStateToProps = (state: ReduxStoreState) => ({
  blob: Modules.selectors.challenges.getBlobForCurrentChallenge(state),
});

const dispatchProps = {
  updateChallenge: Modules.actions.challenges.updateChallenge,
  updateCurrentChallengeBlob:
    Modules.actions.challenges.updateCurrentChallengeBlob,
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
