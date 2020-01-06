import Button from "@material-ui/core/Button";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import Switch from "@material-ui/core/Switch";
import Assignment from "@material-ui/icons/Assignment";
import Code from "@material-ui/icons/Code";
import { CHALLENGE_TYPE } from "@pairwise/common";
import Modules, { ReduxStoreState } from "modules/root";
import React from "react";
import { connect } from "react-redux";
import styled from "styled-components/macro";

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

const EditingToolbar = connect(
  mapToolbarState,
  toolbarDispatchProps,
)((props: EditChallengeControlsConnectProps) => {
  const { isEditMode, setEditMode, saveCourse, course, challenge } = props;
  const [anchorEl, setAnchorEl] = React.useState<Nullable<HTMLElement>>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
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

  const choices: Array<{ value: CHALLENGE_TYPE; label: string }> = [
    { value: "markup", label: "Markup" },
    { value: "typescript", label: "TypeScript" },
    { value: "react", label: "React" },
    { value: "media", label: "Media" },
  ];

  // NOTE: I'm defaulting the challenge id to an empty string simply to get past ts errors.
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
        <Button
          color="primary"
          style={{ marginRight: 10 }}
          onClick={handleSave}
        >
          Save
        </Button>
        <Button
          aria-controls="simple-menu"
          aria-haspopup="true"
          onClick={handleClick}
        >
          Type: <strong style={{ marginLeft: 6 }}>{challenge?.type}</strong>
        </Button>
        <Menu
          id="simple-menu"
          anchorEl={anchorEl}
          keepMounted
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          {choices.map(x => (
            <MenuItem
              key={x.value}
              onClick={() => {
                props.updateChallenge({
                  id: challenge?.id || "", // See NOTE
                  challenge: { type: x.value },
                });
                handleClose();
              }}
            >
              <ListItemIcon>
                {x.value === "media" ? (
                  <Assignment fontSize="small" />
                ) : (
                  <Code fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText primary={x.label} />
            </MenuItem>
          ))}
        </Menu>
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
