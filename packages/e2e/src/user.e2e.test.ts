import axios from "axios";
import { fetchAccessToken, HOST } from "./utils/e2e-utils";

/** ===========================================================================
 * e2e Tests for /user APIs
 * ============================================================================
 */

describe("User APIs", () => {
  test("/user/profile (GET)", async () => {
    const accessToken = await fetchAccessToken();
    const result = await axios.get(`${HOST}/user/profile`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(result.data.email).toBeDefined();
    expect(result.data.displayName).toBeDefined();
    expect(result.data.givenName).toBeDefined();
    expect(result.data.familyName).toBeDefined();
  });
});
