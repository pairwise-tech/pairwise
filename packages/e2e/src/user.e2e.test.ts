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

    const { profile } = result.data;
    expect(profile.email).toBeDefined();
    expect(profile.displayName).toBeDefined();
    expect(profile.givenName).toBeDefined();
    expect(profile.familyName).toBeDefined();
  });

  test("/user/profile (POST)", async () => {
    const accessToken = await fetchAccessToken();
    const headers = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    const result = await axios.get(`${HOST}/user/profile`, headers);
    const originalProfile = result.data.profile;

    const displayName = "孫瑪思！";
    const profileImageUrl = "www.my-new-image.com";
    const body = {
      displayName,
      profileImageUrl,
    };

    const update = await axios.post(`${HOST}/user/profile`, body, headers);

    const { profile } = update.data;
    expect(profile.displayName).toBe(displayName);
    expect(profile.profileImageUrl).toBe(profileImageUrl);
    expect(profile.email).toBe(originalProfile.email);
    expect(profile.givenName).toBe(originalProfile.givenName);
    expect(profile.familyName).toBe(originalProfile.familyName);
  });
});
