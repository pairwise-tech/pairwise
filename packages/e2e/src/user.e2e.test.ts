import axios from "axios";
import request from "supertest";
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

    const { profile, settings } = result.data;
    expect(profile.email).toBeDefined();
    expect(profile.displayName).toBeDefined();
    expect(profile.givenName).toBeDefined();
    expect(profile.familyName).toBeDefined();
    expect(settings).toBeDefined();
    expect(settings.workspaceFontSize).toBe(12);
  });

  test("/user/profile (POST) a user can update their profile", async () => {
    const accessToken = await fetchAccessToken();
    const headers = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    const result = await axios.get(`${HOST}/user/profile`, headers);
    const originalProfile = result.data.profile;
    const originalSettings = result.data.settings;

    const displayName = "孫瑪思！";
    const avatarUrl = "www.my-new-image.com";
    const body = {
      displayName,
      avatarUrl,
      settings: {
        workspaceFontSize: 18,
        theme: "hc-black",
      },
    };

    const update = await axios.post(`${HOST}/user/profile`, body, headers);

    const { profile, settings } = update.data;
    expect(profile.displayName).toBe(displayName);
    expect(profile.avatarUrl).toBe(avatarUrl);
    expect(settings).toBeDefined();
    expect(profile.email).toBe(originalProfile.email);
    expect(profile.givenName).toBe(originalProfile.givenName);
    expect(profile.familyName).toBe(originalProfile.familyName);
    expect(originalSettings.workspaceFontSize).toBe(12);
    expect(settings.workspaceFontSize).toBe(18);
    expect(settings.theme).toBe("hc-black");
  });

  test("/user/profile (POST) filters invalid parameters, and updates settings correctly", async done => {
    const accessToken = await fetchAccessToken();
    const headers = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    const handleUpdateUser = async (userUpdate: { [key: string]: any }) => {
      await request(`${HOST}/user/profile`)
        .post("/")
        .send(userUpdate)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(201);
    };

    let result = await axios.get(`${HOST}/user/profile`, headers);
    const originalProfile = result.data.profile;

    /**
     * [1] Existing settings are merged correctly when updates occur.
     */
    await handleUpdateUser({
      settings: {
        workspaceFontSize: null,
        theme: "Djikstra Theme",
      },
    });

    result = await axios.get(`${HOST}/user/profile`, headers);
    const firstSettings = result.data.settings;

    expect(firstSettings.theme).toBe("vs-dark");
    expect(firstSettings.workspaceFontSize).toBe(12);

    /**
     * [2] Invalid update values are ignored.
     */
    await handleUpdateUser({
      name: "my special name field",
      displayName: "Djikstra",
      specialField: true,
      value: 5000,
      settings: {
        workspaceFontSize: 28,
        invalidSetting: "true",
        theme: "Djikstra Theme",
      },
    });

    result = await axios.get(`${HOST}/user/profile`, headers);
    const secondProfile = result.data.profile;
    const secondSettings = result.data.settings;

    expect(secondProfile.displayName).toBe("Djikstra");
    expect(secondSettings.theme).toBe("vs-dark");
    expect(secondSettings.workspaceFontSize).toBe(28);
    expect(secondProfile.email).toBe(originalProfile.email);
    expect(secondProfile.avatarUrl).toBe(originalProfile.avatarUrl);
    expect(secondProfile.givenName).toBe(originalProfile.givenName);
    expect(secondProfile.familyName).toBe(originalProfile.familyName);

    /**
     * [3] The theme setting can be updated, if a valid theme is provided.
     */
    await handleUpdateUser({
      settings: {
        theme: "hc-black",
        workspaceFontSize: "55",
      },
    });

    result = await axios.get(`${HOST}/user/profile`, headers);
    const thirdSettings = result.data.settings;

    expect(thirdSettings.theme).toBe("hc-black");
    expect(thirdSettings.workspaceFontSize).toBe(28);

    done();
  });
});
