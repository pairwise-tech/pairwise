import axios from "axios";

/** ===========================================================================
 * e2e Test Utils
 * ============================================================================
 */

const HOST = process.env.HOST || "http://localhost:9000";

const HARD_CODED_FB_ACCESS_TOKEN =
  "EAAGVjNBRNAQBANZAADnztFVVC3Qi0KQst6gxPTbxVWbLcf0cx7Sih0pwn7elK69NVvZAfJYOX8fgA5eurgEijXXqjcLOmTZCCMTgH1jrmlZA67HaymQ1uvsbJnM73aXZAUGPltYkwdoDJAXpi84HjVixwT4EMRCHIfjAnZCsWJJCY6LpFT62PIZCNvlg7YWaSQyq6ombABjoAZDZD";

const fetchAccessToken = async () => {
  const result = await axios.get(
    `${HOST}/auth/facebook?access_token=${HARD_CODED_FB_ACCESS_TOKEN}`,
  );
  const { accessToken } = result.data;
  return accessToken;
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export { HOST, HARD_CODED_FB_ACCESS_TOKEN, fetchAccessToken };
