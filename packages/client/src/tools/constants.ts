/** ===========================================================================
 * Colors
 * ============================================================================
 */

export const COLORS = {
  SUCCESS: "#2ee3ff",
  FAILURE: "#fc426d",
  LIGHT_FAILURE: "#ff7a8a",
  PRIMARY_BLUE: "#2ee3ff",
  PRIMARY_GREEN: "rgb(0, 255, 185)",
  SECONDARY_PINK: "#f50057",
  BETA_LABEL: "#ff2153",
  RED: "#f7142b",
  LIGHT_RED: "#fc3045",
  PINK: "rgb(252, 66, 109, 1)",
  YOUTUBE_RED: "rgb(202,8,19)",
  SECONDARY_YELLOW: "#ffdf75",
  SECONDARY_ORANGE: "#FFB85A",
  NAVY_BLUE: "#176191",
  HEADER_BORDER: "#176191",
  LIGHT_GREY: "#404040",
  WHITE: "rgb(250,250,250)",
  TEXT_WHITE: "rgb(250,250,250)",
  TEXT_HOVER: "rgb(245, 245, 245)",
  TEXT_TITLE: "rgb(205, 205, 205)",
  TEXT_CONTENT: "rgb(200, 200, 200)",
  DARK_BORDER: "rgb(100, 100, 100)",
  LIGHT_BORDER: "rgb(195, 195, 195)",
  NAV_LIGHT_BORDER: "rgb(150, 150, 150)",
  TEXT_GRAY: "rgb(175, 175, 175)",
  TEXT_LIGHT_THEME: "#182026",
  GRAY: "rgb(175, 175, 175)",
  TEXT_CONTENT_BRIGHT: "rgb(225, 225, 225)",
  TEXT_DARK: "rgb(40,40,40)",
  DRAGGABLE_SLIDER_DARK: "#2E2E2E",
  DRAGGABLE_SLIDER_LIGHT: "rgb(215,215,215)",
  DRAGGABLE_SLIDER_BORDER: "#1b1b1b",
  BACKGROUND_PAGE_DARK: "#1e1e1e",
  BACKGROUND_PAGE_LIGHT: "rgb(245,245,245)",
  BACKGROUND_HEADER: "#010203",
  PROGRESS_BACKGROUND: "rgb(15,15,15)",
  PROGRESS_COMPLETE: "#44f1bd",
  BACKGROUND_CONTENT_DARK: "#242424",
  BACKGROUND_CONTENT_LIGHT: "rgb(225,225,225)",
  BACKGROUND_EDITOR: "rgb(35, 35, 35)",
  BACKGROUND_CONSOLE_DARK: "rgb(36, 36, 36)",
  BACKGROUND_CONSOLE_LIGHT: "rgb(215, 215, 215)",
  BACKGROUND_LOWER_SECTION: "rgb(30, 30, 30)",
  BACKGROUND_DROPDOWN_MENU: "rgb(38, 38, 38)",
  BACKGROUND_DROPDOWN_MENU_HOVER: "rgb(24, 24, 24)",
  BORDER_DROPDOWN_MENU_ITEM: "rgb(45, 45, 45)",
  BACKGROUND_MODAL_DARK: "rgb(25, 25, 25)",
  BACKGROUND_MODAL_LIGHT: "rgb(255, 255, 255)",
  REVEAL_SOLUTION_LABEL_BACKGROUND: "rgb(25, 25, 25)",
  REVEAL_SOLUTION_LABEL_BACKGROUND_HOVER: "rgb(30, 30, 30)",
  BACKGROUND_EMAIL_LOGIN_BUTTON: "rgb(40,40,40)",
  BACKGROUND_INPUT: "rgb(55,55,55)",
  BACKGROUND_ACCOUNT_BUTTON: "rgb(25, 25, 25)",
  BACKGROUND_BODY: "#13141d",
  BACKGROUND_NAVIGATION_ITEM_DARK: "#404040",
  BACKGROUND_NAVIGATION_ITEM_LIGHT: "rgb(235,235,235)",
  BACKGROUND_NAVIGATION_ITEM_HOVER_DARK: "#0d0d0d",
  BACKGROUND_NAVIGATION_ITEM_HOVER_LIGHT: "rgb(245,245,245)",
  NEON_GREEN: "#44f1bd",
  GRADIENT_GREEN:
    "linear-gradient( 90deg, rgba(0, 255, 177, 1) 22%, rgba(0, 255, 211, 1) 74%)",
  GRADIENT_PINK:
    "linear-gradient( 90deg, rgb(252, 66, 109, 1) 22%, rgb(255, 122, 138, 1) 74%)",
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

// These are not within some actions file because they are not action creators.
// They are message types for the search worker
export const SEARCH = "SEARCH";
export const SEARCH_SUCCESS = "SEARCH_SUCCESS";
export const BUILD_SEARCH_INDEX = "BUILD_SEARCH_INDEX_SUCCESS";
export const BUILD_SEARCH_INDEX_SUCCESS = "BUILD_SEARCH_INDEX_SUCCESS";
export const BUILD_SEARCH_INDEX_FAILURE = "BUILD_SEARCH_INDEX_FAILURE";

// the threshold for how many chars in a query before we start searching
export const SEARCH_QUERY_THRESHOLD = 2;

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

export const DESKTOP = `(min-width: 768px)`;
