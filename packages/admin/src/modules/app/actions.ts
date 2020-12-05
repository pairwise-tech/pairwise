import { createAction } from "typesafe-actions";
import { Location as HistoryLocation } from "history";
import { ParsedQuery } from "query-string";
import { APP_INITIALIZATION_TYPE } from "tools/utils";

/** ===========================================================================
 * Action Types
 * ============================================================================
 */

enum ActionTypesEnum {
  EMPTY_ACTION = "EMPTY_ACTION",
  INITIALIZE_APP = "INITIALIZE_APP",
  INITIALIZE_APP_SUCCESS = "INITIALIZE_APP_SUCCESS",
  CAPTURE_APP_INITIALIZATION_URL = "CAPTURE_APP_INITIALIZATION_URL",
  TOGGLE_PAGE_SCROLL_LOCK = "TOGGLE_PAGE_SCROLL_LOCK",
  LOCATION_CHANGE = "LOCATION_CHANGE",
  APP_INITIALIZATION_FAILED = "APP_INITIALIZATION_FAILED",
  SET_SCREENSAVER_STATE = "SET_SCREENSAVER_STATE",
}

/** ===========================================================================
 * Actions
 * ============================================================================
 */

/**
 * The empty action is used at various places in the epics to handle a code
 * path which does not produce any relevant action. But it still represents
 * some event happening, i.e. that code path, and the epics have to return
 * actions anyway, so we can return this empty action, and include a string
 * payload which describes where the action is coming from (for debugging
 * or informational purposes).
 */
export const empty = createAction(ActionTypesEnum.EMPTY_ACTION)<string>();

export const locationChange = createAction(ActionTypesEnum.LOCATION_CHANGE)<
  HistoryLocation
>();

export const initializeApp = createAction(ActionTypesEnum.INITIALIZE_APP)<{
  location: Location;
}>();

export const initializeAppSuccess = createAction(
  ActionTypesEnum.INITIALIZE_APP_SUCCESS,
)<{ accessToken: string }>();

export const captureAppInitializationUrl = createAction(
  ActionTypesEnum.CAPTURE_APP_INITIALIZATION_URL,
)<{
  location: Location;
  params: ParsedQuery<string>;
  appInitializationType: APP_INITIALIZATION_TYPE;
}>();

export const appInitializationFailed = createAction(
  ActionTypesEnum.APP_INITIALIZATION_FAILED,
)();

export const setScreensaverState = createAction(
  ActionTypesEnum.SET_SCREENSAVER_STATE,
)<boolean>();
