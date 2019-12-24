/** ===========================================================================
 * Colors
 * ============================================================================
 */

const COLORS = {
  SUCCESS: "#2ee3ff",
  FAILURE: "#fc426d",
  PRIMARY_BLUE: "#2ee3ff",
  HEADER_BORDER: "#176191",
  TEXT_HOVER: "rgb(245, 245, 245)",
  TEXT_TITLE: "rgb(200, 200, 200)",
  TEXT_CONTENT: "rgb(165, 165, 165)",
  DRAGGABLE_SLIDER: "#2E2E2E",
  DRAGGABLE_SLIDER_BORDER: "#1b1b1b",
  BACKGROUND_HEADER: "#010203",
  BACKGROUND_CONTENT: "#242424",
  BACKGROUND_EDITOR: "rgb(35, 35, 35)",
  BACKGROUND_CONSOLE: "rgb(36, 36, 36)",
  BACKGROUND_LOWER_SECTION: "rgb(30, 30, 30)",
  BACKGROUND_MODAL: "rgb(25, 25, 25)",
};

/** ===========================================================================
 * Dimensions
 * ============================================================================
 */

const W = window.innerWidth;
const H = window.innerHeight;
const HEADER_HEIGHT = 50;

const DIMENSIONS = {
  WORKSPACE_HEIGHT: H - HEADER_HEIGHT,
  EDITOR_PANEL_WIDTH: W * 0.65,

  CHALLENGE_CONTENT_HEIGHT: H * 0.2,
  EDITOR_HEIGHT: H * 0.5 - HEADER_HEIGHT,
  TEST_CONTENT_HEIGHT: H * 0.3,

  PREVIEW_HEIGHT: H * 0.6 - HEADER_HEIGHT,
  CONSOLE_HEIGHT: H * 0.4,
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export { COLORS, DIMENSIONS, HEADER_HEIGHT };
