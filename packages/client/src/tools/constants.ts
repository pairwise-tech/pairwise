/** ===========================================================================
 * Colors
 * ============================================================================
 */

export const COLORS = {
  SUCCESS: "#2ee3ff",
  FAILURE: "#fc426d",
  PRIMARY_BLUE: "#2ee3ff",
  PRIMARY_GREEN: "rgb(0, 255, 185)",
  SECONDARY_PINK: "#f50057",
  SECONDARY_YELLOW: "rgb(246, 250, 136)",
  HEADER_BORDER: "#176191",
  LIGHT_GREY: "#404040",
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
  NEON_GREEN: "#44f1bd",
  GRADIENT_GREEN:
    "linear-gradient( 90deg, rgba(0, 255, 177, 1) 22%, rgba(0, 255, 211, 1) 74%)",
  BORDER_MODAL: "rgb(100,100,100)",
};

export const MONACO_EDITOR_INITIAL_FONT_SIZE = 12;
// How much to increase or decrease font size with each interaction
export const MONACO_EDITOR_FONT_SIZE_STEP = 2;

/**
 * A cap on prose width so that we don't end up with super wide text. This was
 * originally created for the media area where there is currently no other UI
 * besides the text.
 */
export const PROSE_MAX_WIDTH = 900;

/** ===========================================================================
 * Constants
 * ============================================================================
 */

// Thse are not within some actions file because they are not action creators.
// They are message types for the search worker
export const SEARCH = "SEARCH";
export const SEARCH_SUCCESS = "SEARCH_SUCCESS";
export const BUILD_SEARCH_INDEX = "BUILD_SEARCH_INDEX_SUCCESS";
export const BUILD_SEARCH_INDEX_SUCCESS = "BUILD_SEARCH_INDEX_SUCCESS";
export const BUILD_SEARCH_INDEX_FAILURE = "BUILD_SEARCH_INDEX_FAILURE";

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

// Media queries
export const MOBILE = `(max-width: 768px)`;
