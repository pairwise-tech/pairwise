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

    const { profile } = result.data;
    expect(profile.email).toBeDefined();
    expect(profile.displayName).toBeDefined();
    expect(profile.givenName).toBeDefined();
    expect(profile.familyName).toBeDefined();
    expect(profile.settings).toBeDefined();
    expect(profile.settings.workspaceFontSize).toBe(12);
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
    const avatarUrl = "www.my-new-image.com";
    const body = {
      displayName,
      avatarUrl,
      settings: {
        workspaceFontSize: 18,
      },
    };

    const update = await axios.post(`${HOST}/user/profile`, body, headers);

    const { profile } = update.data;
    expect(profile.displayName).toBe(displayName);
    expect(profile.avatarUrl).toBe(avatarUrl);
    expect(profile.settings).toBeDefined();
    expect(profile.email).toBe(originalProfile.email);
    expect(profile.givenName).toBe(originalProfile.givenName);
    expect(profile.familyName).toBe(originalProfile.familyName);
    expect(originalProfile.settings.workspaceFontSize).toBe(12);
    expect(profile.settings.workspaceFontSize).toBe(18);
  });

  test("/user/profile (POST) fails invalid update operations", async done => {
    const accessToken = await fetchAccessToken();
    const headers = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    let result = await axios.get(`${HOST}/user/profile`, headers);
    const originalProfile = result.data.profile;

    await request(`${HOST}/user/profile`)
      .post("/")
      .send({
        name: "my special name field",
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(400)
      .expect(response => {
        expect(response.body.message).toBe(
          "Invalid update parameters provided",
        );
      });

    await request(`${HOST}/user/profile`)
      .post("/")
      .send({
        settings: {
          workspaceFontSize: "50",
        },
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(400)
      .expect(response => {
        expect(response.body.message).toBe(
          "Invalid update parameters provided",
        );
      });

    result = await axios.get(`${HOST}/user/profile`, headers);
    const secondProfile = result.data.profile;
    expect(originalProfile).toEqual(secondProfile);

    done();
  });

  test("/user/profile (POST) filters invalid parameters, but updates valid parameters", async done => {
    const accessToken = await fetchAccessToken();
    const headers = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    let result = await axios.get(`${HOST}/user/profile`, headers);
    const originalProfile = result.data.profile;

    await request(`${HOST}/user/profile`)
      .post("/")
      .send({
        name: "my special name field",
        displayName: "Djikstra",
        specialField: true,
        value: 5000,
        settings: {
          workspaceFontSize: 28,
          invalidSetting: "true",
        },
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(201);

    result = await axios.get(`${HOST}/user/profile`, headers);
    const secondProfile = result.data.profile;

    expect(secondProfile.displayName).toBe("Djikstra");
    expect(secondProfile.settings.workspaceFontSize).toBe(28);
    expect(secondProfile.email).toBe(originalProfile.email);
    expect(secondProfile.avatarUrl).toBe(originalProfile.avatarUrl);
    expect(secondProfile.givenName).toBe(originalProfile.givenName);
    expect(secondProfile.familyName).toBe(originalProfile.familyName);

    done();
  });
});
