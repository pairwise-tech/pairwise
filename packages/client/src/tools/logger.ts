import { createLogger } from "redux-logger";

/** ===========================================================================
 * Redux Logger Configuration
 * ============================================================================
 */

const TITLE = "#15B06D";
const ACTION = "#ff6647";
const NEXT_STATE = "#50adfa";

const logger = createLogger({
  collapsed: true,
  duration: true,
  level: {
    prevState: false,
    action: "info",
    nextState: "info",
  },
  colors: {
    title: () => TITLE,
    action: () => ACTION,
    nextState: () => NEXT_STATE,
  },
});

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default logger;
