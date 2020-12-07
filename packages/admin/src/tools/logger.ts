import { createLogger } from "redux-logger";

/** ===========================================================================
 * Redux Logger Configuration
 * ============================================================================
 */

const TITLE = "#ff6647";
const ACTION = "#ffe75e";
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
