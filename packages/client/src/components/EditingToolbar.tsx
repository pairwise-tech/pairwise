import { CHALLENGE_TYPE } from "@pairwise/common";
import Modules, { ReduxStoreState } from "modules/root";
import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";
import { Switch, Button, ButtonGroup } from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";
import { SANDBOX_ID } from "tools/constants";

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

type EditChallengeControlsConnectProps = ReturnType<typeof mapToolbarState> &
  typeof toolbarDispatchProps;

interface ChallengeTypeOption {
  value: CHALLENGE_TYPE;
  label: string;
}

const CHALLENGE_TYPE_CHOICES: ChallengeTypeOption[] = [
  { value: "markup", label: "Markup" },
  { value: "typescript", label: "TypeScript" },
  { value: "react", label: "React" },
  { value: "media", label: "Media" },
];

const ChallengeTypeSelect = Select.ofType<ChallengeTypeOption>();

const EditingToolbar = connect(
  mapToolbarState,
  toolbarDispatchProps,
)((props: EditChallengeControlsConnectProps) => {
  const { isEditMode, setEditMode, saveCourse, course, challenge } = props;

  if (challenge?.id === SANDBOX_ID) {
    // The sandbox is meant to be just that, and cannot be editted in the same
    // way the course challenges can be
    return null;
  }

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
        style={{ marginBottom: 0, marginRight: 20 }}
        checked={isEditMode}
        onChange={handleChange}
        large
        labelElement={"Edit"}
      />
      <SlideOut show={isEditMode}>
        <Button
          large
          minimal
          intent="primary"
          style={{ marginRight: 10 }}
          onClick={handleSave}
        >
          Save
        </Button>
        <ChallengeTypeSelect
          filterable={false}
          items={CHALLENGE_TYPE_CHOICES}
          itemListRenderer={({ renderItem, items }) => (
            <ButtonGroup
              style={{ minWidth: 150 }}
              fill
              alignText="left"
              vertical
            >
              {items.map(renderItem)}
            </ButtonGroup>
          )}
          itemRenderer={(x, { handleClick, modifiers }) => (
            <Button
              key={x.value}
              icon={x.value === "media" ? "video" : "code"}
              text={x.label}
              onClick={handleClick}
              active={modifiers.active}
            />
          )}
          onItemSelect={x => {
            props.updateChallenge({
              id: challenge?.id || "", // See NOTE
              challenge: { type: x.value },
            });
          }}
        >
          <Button
            rightIcon="caret-down"
            aria-controls="simple-menu"
            aria-haspopup="true"
          >
            Type: <strong style={{ marginLeft: 6 }}>{challenge?.type}</strong>
          </Button>
        </ChallengeTypeSelect>
      </SlideOut>
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
