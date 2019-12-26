import { Button, FormControlLabel, Switch } from "@material-ui/core";
import Modules, { ReduxStoreState } from "modules/root";
import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";

const mapToolbarState = (state: ReduxStoreState) => ({
  isEditMode: Modules.selectors.challenges.isEditMode(state),
  course: Modules.selectors.challenges.getCurrentCourse(state),
});

const toolbarDispatchProps = {
  setEditMode: Modules.actions.challenges.setEditMode,
  saveCourse: Modules.actions.challenges.saveCourse,
};

type EditChallengeControlsConnectProps = ReturnType<typeof mapToolbarState> &
  typeof toolbarDispatchProps;

const EditingToolbar = connect(
  mapToolbarState,
  toolbarDispatchProps,
)((props: EditChallengeControlsConnectProps) => {
  const { isEditMode, setEditMode, saveCourse, course } = props;
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

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <FormControlLabel
        style={{ color: "white" }}
        control={
          <Switch
            checked={isEditMode}
            onChange={handleChange}
            color="primary"
            value="isEditMode"
          />
        }
        label="Edit"
      />
      <SlideOut show={isEditMode}>
        <Button color="primary" onClick={handleSave}>
          Save
        </Button>
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
