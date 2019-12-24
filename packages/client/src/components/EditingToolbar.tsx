import { FormControlLabel, Switch } from "@material-ui/core";
import Modules, { ReduxStoreState } from "modules/root";
import React from "react";
import { connect } from "react-redux";

const mapToolbarState = (state: ReduxStoreState) => ({
  isEditMode: Modules.selectors.challenges.isEditMode(state),
});

const toolbarDispatchProps = {
  setEditMode: Modules.actions.challenges.setEditMode,
};

type EditChallengeControlsConnectProps = ReturnType<typeof mapToolbarState> &
  typeof toolbarDispatchProps;

const EditingToolbar = connect(
  mapToolbarState,
  toolbarDispatchProps,
)(({ isEditMode, setEditMode }: EditChallengeControlsConnectProps) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditMode(event.target.checked);
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
    </div>
  );
});

export default EditingToolbar;
