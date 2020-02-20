/** ===========================================================================
 * Colors
 * ============================================================================
 */

const COLORS = {
  SUCCESS: "#2ee3ff",
  FAILURE: "#fc426d",
  PRIMARY_BLUE: "#2ee3ff",
  PRIMARY_GREEN: "rgb(0, 255, 185)",
  SECONDARY_PINK: "#f50057",
  HEADER_BORDER: "#176191",
  SEPARATOR_BORDER: "#404040",
  TEXT_WHITE: "rgb(250,250,250)",
  TEXT_HOVER: "rgb(245, 245, 245)",
  TEXT_TITLE: "rgb(200, 200, 200)",
  TEXT_CONTENT: "rgb(165, 165, 165)",
  TEXT_CONTENT_BRIGHT: "rgb(225, 225, 225)",
  TEXT_DARK: "rgb(40,40,40)",
  DRAGGABLE_SLIDER: "#2E2E2E",
  DRAGGABLE_SLIDER_BORDER: "#1b1b1b",
  BACKGROUND_HEADER: "#010203",
  BACKGROUND_CONTENT: "#242424",
  BACKGROUND_EDITOR: "rgb(35, 35, 35)",
  BACKGROUND_CONSOLE: "rgb(36, 36, 36)",
  BACKGROUND_LOWER_SECTION: "rgb(30, 30, 30)",
  BACKGROUND_DROPDOWN_MENU: "rgb(38, 38, 38)",
  BACKGROUND_DROPDOWN_MENU_HOVER: "rgb(24, 24, 24)",
  BORDER_DROPDOWN_MENU_ITEM: "rgb(45, 45, 45)",
  BACKGROUND_MODAL: "rgb(25, 25, 25)",
  BACKGROUND_INPUT: "rgb(55,55,55)",
  BACKGROUND_ACCOUNT_BUTTON: "rgb(25, 25, 25)",
  BACKGROUND_BODY: "#13141d",
  GRADIENT_GREEN:
    "linear-gradient( 90deg, rgba(0, 255, 177, 1) 22%, rgba(0, 255, 211, 1) 74%)",
  BORDER_MODAL: "rgb(100,100,100)",
};

/** ===========================================================================
 * Dimensions
 * ============================================================================
 */

const W = window.innerWidth;
const H = window.innerHeight;
const HEADER_HEIGHT = 60;

export const MONACO_EDITOR_INITIAL_FONT_SIZE = 12;
// How much to increase or decrease font size with each interaction
export const MONACO_EDITOR_FONT_SIZE_STEP = 2;

const DIMENSIONS = {
  WORKSPACE_HEIGHT: H - HEADER_HEIGHT,
  EDITOR_PANEL_WIDTH: W * 0.65,

  CHALLENGE_CONTENT_HEIGHT: H * 0.2,
  EDITOR_HEIGHT: H * 0.5 - HEADER_HEIGHT,
  TEST_CONTENT_HEIGHT: H * 0.3,

  PREVIEW_HEIGHT: H * 0.6 - HEADER_HEIGHT,
  CONSOLE_HEIGHT: H * 0.4,
};

/**
 * A cap on prose width so that we don't end up with super wide text. This was
 * originally created for the media area where there is currently no other UI
 * besides the text.
 */
export const PROSE_MAX_WIDTH = 728;

/** ===========================================================================
 * Constants
 * ============================================================================
 */

/**
 * Serializing the rich content editor state into markdown could have a perf
 * impact if we did it to often, so this is the debounce timeout for that
 * serialization.
 */
export const CONTENT_SERIALIZE_DEBOUNCE = 600;

/**
 * The special ID used for the code sandbox. The sandbox will not be persisted
 * along with the other challenges and online lives in the users browser
 *
 * NOTE: This id will appear on the browser URL, and can be deep linked to, so
 * it should be at least passably memorable.
 */
export const SANDBOX_ID = "sandbox";

/** ===========================================================================
 * Export
 * ============================================================================
 */

export { COLORS, DIMENSIONS, HEADER_HEIGHT };
