import Modules, { ReduxStoreState } from "modules/root";
import React, { Suspense } from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import { Switch, Button } from "@blueprintjs/core";
import { SANDBOX_ID } from "tools/constants";
import { ChallengeTypeOption } from "./ChallengeTypeMenu";
import KeyboardShortcuts from "./KeyboardShortcuts";

const mapToolbarState = (state: ReduxStoreState) => ({
  isEditMode: Modules.selectors.challenges.isEditMode(state),
  course: Modules.selectors.challenges.getCurrentCourse(state),
  challenge: Modules.selectors.challenges.getCurrentChallenge(state),
});

const toolbarDispatchProps = {
  setEditMode: Modules.actions.challenges.setEditMode,
  saveCourse: Modules.actions.challenges.saveCourse,
  updateChallenge: Modules.actions.challenges.updateChallenge,
};

const LazyChallengeTypeMenu = React.lazy(() => import("./ChallengeTypeMenu"));

type EditChallengeControlsConnectProps = ReturnType<typeof mapToolbarState> &
  typeof toolbarDispatchProps;

const CHALLENGE_TYPE_CHOICES: ChallengeTypeOption[] = [
  { value: "markup", label: "Markup" },
  { value: "typescript", label: "TypeScript" },
  { value: "react", label: "React" },
  { value: "media", label: "Media" },
];

const EditingToolbar = connect(
  mapToolbarState,
  toolbarDispatchProps,
)((props: EditChallengeControlsConnectProps) => {
  // For hiding the controls while recording a video.
  const [hidden, setHidden] = React.useState(false);
  const { isEditMode, setEditMode, saveCourse, course, challenge } = props;

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

  // NOTE: I'm defaulting the challenge id to an empty string simply to get past ts errors.
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <Switch
        style={{
          marginBottom: 0,
          marginRight: 20,
          transition: "opacity 0.2s ease-out",
          opacity: hidden ? 0 : 1,
        }}
        checked={isEditMode}
        onChange={handleChange}
        large
        labelElement={"Edit"}
      />
      <SlideOut show={isEditMode && !hidden}>
        <Button
          large
          minimal
          intent="primary"
          style={{ marginRight: 10 }}
          onClick={handleSave}
        >
          Save
        </Button>
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
      <KeyboardShortcuts
        keymap={{
          "cmd+shift+e": toggleHidden,
        }}
      />
    </div>
  );
});

const SlideOut = styled.div<{ show: boolean }>`
  display: block;
  transition: all 0.2s ease-out;
  opacity: ${props => (props.show ? 1 : 0)};
  pointer-events: ${props => (props.show ? "all" : "none")};
  transform: ${props => (props.show ? "translateX(0)" : "translateX(-10px)")};
`;

export default EditingToolbar;
