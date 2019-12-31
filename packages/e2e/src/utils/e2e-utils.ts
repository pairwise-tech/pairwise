import axios from "axios";

/** ===========================================================================
 * e2e Test Utils
 * ============================================================================
 */

const HOST = process.env.HOST || "http://localhost:9000";

const HARD_CODED_FB_ACCESS_TOKEN =
  "EAAGVjNBRNAQBAMCakViKu70m092t1hcuZCGmf6Ud4Y0J5VQV0qzVmSjcNcQAhNZBExYooZAfY8G7YY0zKBHqTWevt07j65dMHLHga9g0rezBXwTZBqlZBAt3iAyxS52KnUIo07gDqAyPejosDoIHLG3BPNNHNsZABYfDtQkRbngzfDUgAclOmcsYNhYQak8NGY5lYyOs6C0QZDZD";

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
