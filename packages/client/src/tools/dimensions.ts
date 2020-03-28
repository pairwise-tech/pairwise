// Dimensions for various UI aspects that are reused in more than one place.
//
// This was initially in constants.ts, however since this file depends on window
// it will break builds for anything without the window context, workers for
// example

const W = window.innerWidth;
const H = window.innerHeight;

export const HEADER_HEIGHT = 60;

const WORKSPACE_HEIGHT = H - HEADER_HEIGHT;

// The height of the draggable separators in the grid (the panel resize handlers)
const SEPARATOR_HEIGHT = 10;

// There are two separators in the left workspace column at present. They are:
// instructions, text editor, tests.
const LEFT_PANEL_SPACE = WORKSPACE_HEIGHT - SEPARATOR_HEIGHT * 2;

export const DIMENSIONS = {
  WORKSPACE_HEIGHT,
  EDITOR_PANEL_WIDTH: W * 0.65,

  // Left panel
  CHALLENGE_CONTENT_HEIGHT: LEFT_PANEL_SPACE * 0.2,
  EDITOR_HEIGHT: LEFT_PANEL_SPACE * 0.5,
  TEST_CONTENT_HEIGHT: LEFT_PANEL_SPACE * 0.3,

  // Right panel
  PREVIEW_HEIGHT: WORKSPACE_HEIGHT * 0.6,
  CONSOLE_HEIGHT: H * 0.4,
};
