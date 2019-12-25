import { Button, FormControlLabel, Switch } from "@material-ui/core";
import Modules, { ReduxStoreState } from "modules/root";
import React from "react";
import { connect } from "react-redux";

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
    <div>
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
      {isEditMode && (
        <Button color="primary" onClick={handleSave}>
          Save
        </Button>
      )}
    </div>
  );
});

export default EditingToolbar;
