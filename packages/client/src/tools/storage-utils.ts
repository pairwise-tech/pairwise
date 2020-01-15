import { SandboxBlob } from "@pairwise/common";
import { defaultSandboxBlob } from "./utils";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

const SANDBOX = "SANDBOX";
const ACCESS_TOKEN_STORAGE_KEY = "ACCESS_TOKEN_STORAGE_KEY";
const EPHEMERAL_PURCHASE_COURSE_ID_KEY = "EPHEMERAL_PURCHASE_COURSE_ID_KEY";

/** ===========================================================================
 * Local Storage Utils
 * ============================================================================
 */

export const saveSandboxToLocalStorage = (blob: SandboxBlob) => {
  localStorage.setItem(SANDBOX, JSON.stringify({ blob }));
};

export const getSandboxFromLocalStorage = (): SandboxBlob => {
  try {
    const blob = localStorage.getItem(SANDBOX);
    if (blob) {
      const result = JSON.parse(blob);
      if (result) {
        return result;
      }
    }
  } catch (err) {
    // do nothing
  }

  return defaultSandboxBlob as SandboxBlob;
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
