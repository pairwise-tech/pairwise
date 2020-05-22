import { SandboxBlob } from "@pairwise/common";
import { defaultSandboxBlob } from "./utils";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

const SANDBOX = "SANDBOX";
const VIEWED_EMAIL_PROMPT = "VIEWED_EMAIL_PROMPT";
const ACCESS_TOKEN_STORAGE_KEY = "ACCESS_TOKEN_STORAGE_KEY";
const EPHEMERAL_PURCHASE_COURSE_ID_KEY = "EPHEMERAL_PURCHASE_COURSE_ID_KEY";

/** ===========================================================================
 * Local Storage Utils
 * ============================================================================
 */

/**
 * Set the viewed email prompt flag.
 */
export const markEmailPromptAsViewed = () => {
  localStorage.setItem(VIEWED_EMAIL_PROMPT, JSON.stringify(true));
};

/**
 * Remove the viewed email prompt flag.
 */
export const removeViewedEmailPrompt = () => {
  localStorage.removeItem(VIEWED_EMAIL_PROMPT);
};

/**
 * Get the viewed email prompt flag.
 */
export const getViewedEmailPromptStatus = () => {
  try {
    const viewed = localStorage.getItem(VIEWED_EMAIL_PROMPT);
    if (viewed === "true") {
      return true;
    }
  } catch (err) {
    // do nothing
  }

  return false;
};

export const saveSandboxToLocalStorage = (blob: SandboxBlob) => {
  localStorage.setItem(SANDBOX, JSON.stringify({ blob }));
};

export const getSandboxFromLocalStorage = (): { blob: SandboxBlob } => {
  try {
    const json = localStorage.getItem(SANDBOX);
    if (json) {
      const result = JSON.parse(json);
      if (result) {
        return result;
      }
    }
  } catch (err) {
    // do nothing
  }

  const blob = defaultSandboxBlob as SandboxBlob;
  return { blob };
};

/**
 * Set the ephemeral purchase course id.
 */
export const setEphemeralPurchaseCourseId = (courseId: string) => {
  localStorage.setItem(EPHEMERAL_PURCHASE_COURSE_ID_KEY, courseId);
};

/**
 * Remove the ephemeral course id.
 */
export const removeEphemeralPurchaseCourseId = () => {
  localStorage.removeItem(EPHEMERAL_PURCHASE_COURSE_ID_KEY);
};

/**
 * Get the ephemeral purchase course id.
 */
export const getEphemeralPurchaseCourseId = () => {
  try {
    const id = localStorage.getItem(EPHEMERAL_PURCHASE_COURSE_ID_KEY);
    if (id) {
      return id;
    }
  } catch (err) {
    // do nothing
  }

  return null;
};

/**
 * Set the access token.
 */
export const setAccessTokenInLocalStorage = (accessToken: string) => {
  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
};

/**
 * Logout: just remove the access token to "".
 */
export const logoutUserInLocalStorage = () => setAccessTokenInLocalStorage("");

/**
 * Get the access token.
 */
export const getAccessTokenFromLocalStorage = () => {
  try {
    const token = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    if (token) {
      return token;
    }
  } catch (err) {
    // do nothing
  }

  return "";
};
