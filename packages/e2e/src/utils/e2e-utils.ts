import axios from "axios";

/** ===========================================================================
 * e2e Test Utils
 * ============================================================================
 */

const HOST = process.env.HOST || "http://localhost:9000";

const HARD_CODED_FB_ACCESS_TOKEN =
  "EAAGVjNBRNAQBAOuGymWeupll003o2XTnbf2uQReFCE4rdYB3HNSkfJt0uOrNMGZAIWEkIobmb1CNZBabpz94TI0kIca656YaKy5JmJwt0tYZAm8BoSGZCRYu6cyOWntl0xCh4v7NxkGmnkf8xpk3gmkWIyRLMggyxJQMjtbfoKZAdEcRwfptLLaPZC1KZB3ZCxULaFxt5R3JLQZDZD";

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
