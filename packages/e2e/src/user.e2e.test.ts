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

    expect(result.data.email).toBe("sean.smith.2009@gmail.com");
    expect(result.data.displayName).toBe("Sean Smith");
    expect(result.data.givenName).toBe("Sean");
    expect(result.data.familyName).toBe("Smith");
  });
});
