import axios from "axios";
import { fetchAccessToken, HOST } from "./utils";

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

    expect(result.data).toEqual({
      uuid: "6e7a1ac2-b3b9-4d3c-b329-747b39855646",
      email: "sean.smith.2009@gmail.com",
      displayName: "Sean Smith",
      givenName: "Sean",
      familyName: "Smith",
    });
  });
});
