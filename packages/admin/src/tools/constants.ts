/** ===========================================================================
 * Colors
 * ============================================================================
 */

export const HEADER_HEIGHT = 60;

export const COLORS = {
  SUCCESS: "#2ee3ff",
  FAILURE: "#fc426d",
  LIGHT_FAILURE: "#ff7a8a",
  PRIMARY_BLUE: "#2ee3ff",
  PRIMARY_GREEN: "rgb(0, 255, 185)",
  SECONDARY_PINK: "#f50057",
  SECONDARY_YELLOW: "#ffdf75",
  SECONDARY_ORANGE: "#FFB85A",
  HEADER_BORDER: "#176191",
  LIGHT_GREY: "#404040",
  WHITE: "rgb(250,250,250)",
  TEXT_WHITE: "rgb(250,250,250)",
  TEXT_HOVER: "rgb(245, 245, 245)",
  TEXT_TITLE: "rgb(200, 200, 200)",
  TEXT_CONTENT: "rgb(195, 195, 195)",
  TEXT_CONTENT_BRIGHT: "rgb(225, 225, 225)",
  TEXT_PLACEHOLDER: "rgb(125, 125, 125)",
  GRAY_TEXT: "rgb(100, 100, 100)",
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
  BACKGROUND_CARD: "rgb(22, 22, 22)",
  REVEAL_SOLUTION_LABEL_BACKGROUND: "rgb(25, 25, 25)",
  REVEAL_SOLUTION_LABEL_BACKGROUND_HOVER: "rgb(30, 30, 30)",
  BACKGROUND_EMAIL_LOGIN_BUTTON: "rgb(40,40,40)",
  BACKGROUND_INPUT: "rgb(55,55,55)",
  BACKGROUND_ACCOUNT_BUTTON: "rgb(25, 25, 25)",
  BACKGROUND_BODY: "#13141d",
  BACKGROUND_NAVIGATION_ITEM: "#404040",
  BACKGROUND_NAVIGATION_ITEM_HOVER: "#0d0d0d",
  NEON_GREEN: "#44f1bd",
  GRADIENT_GREEN:
    "linear-gradient( 90deg, rgba(0, 255, 177, 1) 22%, rgba(0, 255, 211, 1) 74%)",
  GRADIENT_PINK:
    "linear-gradient( 90deg, rgb(252, 66, 109, 1) 22%, rgb(255, 122, 138, 1) 74%)",
  BORDER_MODAL: "rgb(100,100,100)",
};

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

// Media queries
export const MOBILE = `(max-width: 768px)`;
