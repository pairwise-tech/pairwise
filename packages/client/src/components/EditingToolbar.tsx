import Modules, { ReduxStoreState } from "modules/root";
import React, { Suspense } from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import { Switch, Button, Tooltip, Position } from "@blueprintjs/core";
import { SANDBOX_ID } from "tools/constants";
import { ChallengeTypeOption } from "./ChallengeTypeMenu";
import KeyboardShortcuts from "./KeyboardShortcuts";
import { CHALLENGE_TYPE } from "@pairwise/common";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

const LazyChallengeTypeMenu = React.lazy(() => import("./ChallengeTypeMenu"));

type EditChallengeControlsConnectProps = ReturnType<typeof mapToolbarState> &
  typeof toolbarDispatchProps;

type ChallengeTypeChoiceMap = { [key in CHALLENGE_TYPE]: string };

/**
 * Map of challenge types to choice labels.
 */
const challengeTypeChoiceMap: ChallengeTypeChoiceMap = {
  section: "Section",
  media: "Media",
  markup: "Markup",
  typescript: "TypeScript",
  react: "React",
  project: "Project",
  "guided-project": "Guided Project",
  "special-topic": "Special Topic",
};

const mapChallengeTypeEntries = (
  entry: [string, string],
): ChallengeTypeOption => {
  const [key, label] = entry;
  return {
    value: key as CHALLENGE_TYPE /* Screw you TypeScript! */,
    label,
  };
};

/**
 * Turn the well-typed challenge type choice map into a list of options
 * without elegance.
 */
const CHALLENGE_TYPE_CHOICES = Object.entries(challengeTypeChoiceMap).map(
  mapChallengeTypeEntries,
);

/** ===========================================================================
 * React Component
 * ============================================================================
 */

const EditingToolbar = (props: EditChallengeControlsConnectProps) => {
  // For hiding the controls while recording a video.
  const [hidden, setHidden] = React.useState(false);
  const {
    course,
    challenge,
    activeIds,
    isEditMode,
    setEditMode,
    saveCourse,
    overlayVisible,
  } = props;

  const { currentCourseId, currentModuleId, currentChallengeId } = activeIds;

  const canDelete = currentCourseId && currentModuleId && currentChallengeId;

  if (challenge?.id === SANDBOX_ID) {
    // The sandbox is meant to be just that, and cannot be edited in the same
    // way the course challenges can be
    return null;
  }

  const toggleHidden = () => {
    setHidden(!hidden);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditMode(event.target.checked);
  };

  const handleSave = () => {
    if (course) {
      saveCourse(course);
    } else {
      console.warn("No course to save!!! WHAT??");
    }
  };

  const handleDelete = () => {
    if (!currentCourseId || !currentModuleId || !currentChallengeId) {
      console.warn("No course, module, or challenge id to delete !!! ¿¿¿");
    } else {
      props.deleteChallenge({
        courseId: currentCourseId,
        moduleId: currentModuleId,
        challengeId: currentChallengeId,
      });
    }
  };

  // NOTE: I'm defaulting the challenge id to an empty string simply to get past ts errors.
  return (
    <div
      style={{
        display: hidden ? "none" : "flex",
        alignItems: "center",
        top: 0,
        left: 0,
      }}
    >
      <Switch
        style={{
          marginBottom: 0,
          marginRight: 10,
        }}
        checked={isEditMode}
        onChange={handleChange}
        large
        labelElement={"Edit"}
      />
      <SlideOut show={isEditMode && !hidden}>
        <Tooltip content="Save" position={Position.BOTTOM}>
          <Button
            icon="saved"
            large
            minimal
            intent="primary"
            onClick={handleSave}
          ></Button>
        </Tooltip>
        {canDelete && (
          <Tooltip content="Delete" position={Position.BOTTOM}>
            <Button
              intent="danger"
              icon="trash"
              large
              minimal
              onClick={handleDelete}
              disabled={overlayVisible}
            ></Button>
          </Tooltip>
        )}
        <Suspense fallback={<p>Menu Loading...</p>}>
          <LazyChallengeTypeMenu
            items={CHALLENGE_TYPE_CHOICES}
            currentChallengeType={challenge?.type}
            onItemSelect={x => {
              props.updateChallenge({
                id: challenge?.id || "", // See NOTE
                challenge: { type: x.value },
              });
            }}
          />
        </Suspense>
      </SlideOut>
      <KeyboardShortcuts keymap={{ "cmd+shift+e": toggleHidden }} />
    </div>
  );
};

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const SlideOut = styled.div<{ show: boolean }>`
  display: flex;
  align-items: center;
  transition: all 0.2s ease-out;
  opacity: ${props => (props.show ? 1 : 0)};
  pointer-events: ${props => (props.show ? "all" : "none")};
  transform: ${props => (props.show ? "translateX(0)" : "translateX(-10px)")};
`;

/** ===========================================================================
 * Props
 * ============================================================================
 */

const mapToolbarState = (state: ReduxStoreState) => ({
  isEditMode: Modules.selectors.challenges.isEditMode(state),
  course: Modules.selectors.challenges.getCurrentCourse(state),
  challenge: Modules.selectors.challenges.getCurrentChallenge(state),
  activeIds: Modules.selectors.challenges.getCurrentActiveIds(state),
  overlayVisible: Modules.selectors.challenges.navigationOverlayVisible(state),
});

const toolbarDispatchProps = {
  setEditMode: Modules.actions.challenges.setEditMode,
  saveCourse: Modules.actions.challenges.saveCourse,
  updateChallenge: Modules.actions.challenges.updateChallenge,
  deleteChallenge: Modules.actions.challenges.deleteChallenge,
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default connect(mapToolbarState, toolbarDispatchProps)(EditingToolbar);
