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

    const { user } = result.data;
    expect(user.email).toBeDefined();
    expect(user.displayName).toBeDefined();
    expect(user.givenName).toBeDefined();
    expect(user.familyName).toBeDefined();
  });
});
