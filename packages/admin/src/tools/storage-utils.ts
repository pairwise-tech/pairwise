/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

const ACCESS_TOKEN_STORAGE_KEY = "ACCESS_TOKEN_STORAGE_KEY";
const MOBILE_REDIRECT_KEY = "PW_MOBILE_REDIRECTED";

/** ===========================================================================
 * Local Storage Utils
 * ============================================================================
 */

// Whether or not the user has been redirected to mobile before. We don't want to redirect them more than once.
export const getMobileRedirected = () => {
  const v = localStorage.getItem(MOBILE_REDIRECT_KEY);
  return v === "true";
};
export const setMobileRedirected = (x: boolean): void => {
  const v = x ? "true" : "false";
  localStorage.setItem(MOBILE_REDIRECT_KEY, v);
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
