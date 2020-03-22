// Dimensions for various UI aspects that are reused in more than one place.
//
// This was initially in constants.ts, however since this file depends on window
// it will break builds for anything without the window context, workers for
// example

const W = window.innerWidth;
const H = window.innerHeight;

export const HEADER_HEIGHT = 60;

export const DIMENSIONS = {
  WORKSPACE_HEIGHT: H - HEADER_HEIGHT,
  EDITOR_PANEL_WIDTH: W * 0.65,
  CHALLENGE_CONTENT_HEIGHT: H * 0.2,
  EDITOR_HEIGHT: H * 0.5 - HEADER_HEIGHT,
  TEST_CONTENT_HEIGHT: H * 0.275,
  PREVIEW_HEIGHT: H * 0.6 - HEADER_HEIGHT,
  CONSOLE_HEIGHT: H * 0.4,
};
