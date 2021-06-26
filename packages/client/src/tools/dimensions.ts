// Dimensions for various UI aspects that are reused in more than one place.
//
// This was initially in constants.ts, however since this file depends on window
// it will break builds for anything without the window context, workers for
// example

export const HEADER_HEIGHT = 60;

export const getDimensions = (
  w = window.innerWidth,
  h = window.innerHeight,
) => {
  const WORKSPACE_HEIGHT = h - HEADER_HEIGHT;

  // The height of the draggable separators in the grid (the panel resize handlers)
  const SEPARATOR_HEIGHT = 10;

  // There are two separators in the left workspace column at present. They are:
  // instructions, text editor, tests.
  const WORKSPACE_PANEL_HEIGHT = WORKSPACE_HEIGHT - SEPARATOR_HEIGHT * 2;

  const EDITOR_PANEL_WIDTH = w * 0.65;

  // Left panel default measurements
  const CHALLENGE_CONTENT_HEIGHT = WORKSPACE_PANEL_HEIGHT * 0.2;
  const EDITOR_HEIGHT = WORKSPACE_PANEL_HEIGHT * 0.5;
  const TEST_CONTENT_HEIGHT = WORKSPACE_PANEL_HEIGHT * 0.3;

  // Left Panel collapsed instructions view
  const CHALLENGE_CONTENT_HEIGHT_COLLAPSED = WORKSPACE_PANEL_HEIGHT * 0.05;
  const EDITOR_HEIGHT_INSTRUCTIONS_COLLAPSED = WORKSPACE_PANEL_HEIGHT * 0.65;

  // Editor height full view
  const EDITOR_SECONDARY_HEIGHT =
    SEPARATOR_HEIGHT + EDITOR_HEIGHT + TEST_CONTENT_HEIGHT;

  // Right panel default measurements
  const PREVIEW_HEIGHT = WORKSPACE_HEIGHT * 0.6;
  const CONSOLE_HEIGHT = h * 0.4;

  // Right panel measurements for React Native previews
  const PREVIEW_REACT_NATIVE_HEIGHT = WORKSPACE_PANEL_HEIGHT * 0.92;
  const PREVIEW_CONSOLE_REACT_NATIVE_HEIGHT = WORKSPACE_PANEL_HEIGHT * 0.09;

  const DIMENSIONS = {
    w,
    h,
    WORKSPACE_HEIGHT,
    EDITOR_PANEL_WIDTH,
    CHALLENGE_CONTENT_HEIGHT,
    EDITOR_HEIGHT,
    TEST_CONTENT_HEIGHT,
    PREVIEW_HEIGHT,
    CONSOLE_HEIGHT,
    EDITOR_SECONDARY_HEIGHT,
    CHALLENGE_CONTENT_HEIGHT_COLLAPSED,
    EDITOR_HEIGHT_INSTRUCTIONS_COLLAPSED,
    PREVIEW_REACT_NATIVE_HEIGHT,
    PREVIEW_CONSOLE_REACT_NATIVE_HEIGHT,
  };

  return DIMENSIONS;
};
