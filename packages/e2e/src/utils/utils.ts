import axios from "axios";

/** ===========================================================================
 * e2e Test Utils
 * ============================================================================
 */

const HOST = process.env.HOST || "http://localhost:9000";

const HARD_CODED_FB_ACCESS_TOKEN =
  "EAAGVjNBRNAQBAAcSoGInukfeJdjVMDupPbGDnLGZAtASh2IWnZBacB4AXExk8EUSLwHSIVGK7rwFQpX4cA9ozygVRiXDsxcfsECXawZBbmOXeR5GWFB3fK7S76baCtpqy7rEqqZCHcBJ1cfHuWu8kfOOxWDpA0Tx3Qwi6iPiBWBrJthgqbi42dasVGyO1UKQFelQK14G9wZDZD";

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
