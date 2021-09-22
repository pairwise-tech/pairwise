import axios from "axios";
import request from "supertest";
import {
  fetchAccessToken,
  fetchUserWithAccessToken,
  getRandomUsername,
} from "./utils/e2e-utils";
import { LastActiveChallengeIds } from "@pairwise/common";
import ENV from "./utils/e2e-env";

/** ===========================================================================
 * e2e Tests for /user APIs
 * ============================================================================
 */

describe("User APIs", () => {
  test.todo("[DELETE] /user/account endpoint: test user deletion.");

  test("/user/profile (GET) a user can fetch their profile", async () => {
    const accessToken = await fetchAccessToken();
    const result = await axios.get(`${ENV.HOST}/user/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { profile, settings } = result.data;
    expect(profile.email).toBeDefined();
    expect(profile.username).toBeDefined();
    expect(profile.givenName).toBeDefined();
    expect(profile.familyName).toBeDefined();
    expect(settings).toBeDefined();
    expect(settings.workspaceFontSize).toBe(16);
  });

  test("/user/profile (POST) a user can update their profile", async () => {
    const accessToken = await fetchAccessToken();
    const headers = { headers: { Authorization: `Bearer ${accessToken}` } };

    const result = await axios.get(`${ENV.HOST}/user/profile`, headers);
    const originalProfile = result.data.profile;
    const originalSettings = result.data.settings;

    const username = getRandomUsername();
    const avatarUrl = "www.my-new-image.com";
    const body = {
      username,
      avatarUrl,
      settings: {
        workspaceFontSize: 18,
        editorTheme: "hc-black",
      },
    };

    const update = await axios.post(`${ENV.HOST}/user/profile`, body, headers);

    const { profile, settings } = update.data;
    expect(profile.username).toBe(username);
    expect(profile.avatarUrl).toBe(avatarUrl);
    expect(settings).toBeDefined();
    expect(profile.email).toBe(originalProfile.email);
    expect(profile.givenName).toBe(originalProfile.givenName);
    expect(profile.familyName).toBe(originalProfile.familyName);
    expect(originalSettings.workspaceFontSize).toBe(16);
    expect(settings.workspaceFontSize).toBe(18);
    expect(settings.editorTheme).toBe("hc-black");
  });

  test("/user/profile (POST) name updates are limited by maximum length", async () => {
    const accessToken = await fetchAccessToken();
    await request(`${ENV.HOST}/user/profile`)
      .post("/")
      .send({ givenName: "asdfasdfasfasdfasdfasiodfupoasufdopaufopiau" })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(400)
      .then((error) => {
        expect(error.body.message).toBe(
          "Value cannot be greater than 30 characters!",
        );
      });

    return request(`${ENV.HOST}/user/profile`)
      .post("/")
      .send({ familyName: "asdfasdfasfasdfasdfasiodfupoasufdopaufopiau" })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(400)
      .then((error) => {
        expect(error.body.message).toBe(
          "Value cannot be greater than 30 characters!",
        );
      });
  });

  test("/user/profile (POST) username updates are validated correctly", async () => {
    const accessToken = await fetchAccessToken();
    await request(`${ENV.HOST}/user/profile`)
      .post("/")
      .send({ username: "asfdaf0978as0df7a0sd" })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(400)
      .then((error) => {
        expect(error.body.message).toBe(
          "Username is limited to 15 characters.",
        );
      });

    return request(`${ENV.HOST}/user/profile`)
      .post("/")
      .send({ username: "ahfh sadfa" })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(400)
      .then((error) => {
        expect(error.body.message).toBe("Username must not include spaces.");
      });
  });

  test("/user/profile (POST) username must be unique", async () => {
    const accessToken = await fetchAccessToken();
    const headers = { headers: { Authorization: `Bearer ${accessToken}` } };

    // A user takes a username
    const username = getRandomUsername();
    let body = { username };
    let update = await axios.post(`${ENV.HOST}/user/profile`, body, headers);
    let { profile } = update.data;
    expect(profile.username).toBe(username);

    // A different user cannot user it
    const otherAccessToken = await fetchAccessToken();
    const otherHeaders = {
      headers: { Authorization: `Bearer ${otherAccessToken}` },
    };
    await request(`${ENV.HOST}/user/profile`)
      .post("/")
      .send({ username })
      .set("Authorization", `Bearer ${otherAccessToken}`)
      .expect(400)
      .then((error) => {
        expect(error.body.message).toBe(
          "Username is taken, please try another.",
        );
      });

    // Original user changes their username
    const newUsername = getRandomUsername();
    body = { username: newUsername };
    update = await axios.post(`${ENV.HOST}/user/profile`, body, headers);
    profile = update.data.profile;
    expect(profile.username).toBe(newUsername);

    // The different user can now use the first username
    body = { username };
    update = await axios.post(`${ENV.HOST}/user/profile`, body, otherHeaders);
    profile = update.data.profile;
    expect(profile.username).toBe(username);
  });

  test("/user/profile (POST) rejects email parameters", async () => {
    const accessToken = await fetchAccessToken();

    const randomString =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".slice(
        Math.floor(Math.random() * 50),
      );
    const email = `${randomString}@pairwise.tech`;

    return request(`${ENV.HOST}/user/profile`)
      .post("/")
      .send({ email })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(400)
      .then((error) => {
        expect(error.body.message).toBe("Invalid parameters provided.");
      });
  });

  test("/auth/update-email (POST) accepts a new email but does not update the user profile email yet", async (done) => {
    const accessToken = await fetchAccessToken();
    const headers = { headers: { Authorization: `Bearer ${accessToken}` } };

    const randomString =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".slice(
        Math.floor(Math.random() * 50),
      );
    const email = `${randomString}@pairwise.tech`;

    request(`${ENV.HOST}/auth/update-email`)
      .post("/")
      .send({ email })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    const result = await axios.get(`${ENV.HOST}/user/profile`, headers);
    const profile = result.data.profile;

    // Assert email is not updated yet
    expect(profile.email !== email).toBe(true);
    done();
  });

  test("/user/profile (POST) filters invalid parameters, and updates settings correctly", async (done) => {
    const accessToken = await fetchAccessToken();
    const headers = { headers: { Authorization: `Bearer ${accessToken}` } };

    const handleUpdateUser = async (userUpdate: { [key: string]: any }) => {
      await request(`${ENV.HOST}/user/profile`)
        .post("/")
        .send(userUpdate)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(201);
    };

    let result = await axios.get(`${ENV.HOST}/user/profile`, headers);
    const originalProfile = result.data.profile;

    /**
     * [1] Existing settings are merged correctly when updates occur.
     */
    await handleUpdateUser({
      settings: {
        workspaceFontSize: NaN,
        editorTheme: "Djikstra Theme",
      },
    });

    result = await axios.get(`${ENV.HOST}/user/profile`, headers);
    const firstSettings = result.data.settings;

    expect(firstSettings.editorTheme).toBe("vs-dark");
    expect(firstSettings.workspaceFontSize).toBe(16);

    const username = getRandomUsername();

    /**
     * [2] Invalid update values are ignored.
     */
    await handleUpdateUser({
      name: "my special name field",
      username,
      specialField: true,
      value: 5000,
      settings: {
        workspaceFontSize: 28,
        invalidSetting: "true",
        editorTheme: "Djikstra Theme",
      },
    });

    result = await axios.get(`${ENV.HOST}/user/profile`, headers);
    const secondProfile = result.data.profile;
    const secondSettings = result.data.settings;

    expect(secondProfile.username).toBe(username);
    expect(secondSettings.editorTheme).toBe("vs-dark");
    expect(secondSettings.workspaceFontSize).toBe(28);
    expect(secondProfile.email).toBe(originalProfile.email);
    expect(secondProfile.avatarUrl).toBe(originalProfile.avatarUrl);
    expect(secondProfile.givenName).toBe(originalProfile.givenName);
    expect(secondProfile.familyName).toBe(originalProfile.familyName);

    /**
     * [3] The editor theme setting can be updated, if a valid theme is provided.
     */
    await handleUpdateUser({
      settings: {
        editorTheme: "hc-black",
        workspaceFontSize: "55",
      },
    });

    result = await axios.get(`${ENV.HOST}/user/profile`, headers);
    const thirdSettings = result.data.settings;

    expect(thirdSettings.editorTheme).toBe("hc-black");
    expect(thirdSettings.workspaceFontSize).toBe(28);

    /**
     * [5] The app theme setting disregards invalid updates.
     */
    await handleUpdateUser({
      settings: {
        appTheme: "blega",
        workspaceFontSize: "55",
      },
    });

    result = await axios.get(`${ENV.HOST}/user/profile`, headers);
    const fourthSettings = result.data.settings;

    expect(fourthSettings.appTheme).toBe("dark");

    /**
     * [5] The aoo theme setting can be updated, if a valid theme is provided.
     */
    await handleUpdateUser({
      settings: {
        appTheme: "light",
        workspaceFontSize: "55",
      },
    });

    result = await axios.get(`${ENV.HOST}/user/profile`, headers);
    const fifthSettings = result.data.settings;

    expect(fifthSettings.appTheme).toBe("light");

    done();
  });

  test("/active-challenge-ids (POST) validates requests correctly", async (done) => {
    const accessToken = await fetchAccessToken();
    const authorizationHeader = `Bearer ${accessToken}`;

    await request(`${ENV.HOST}/user/active-challenge-ids`)
      .post("/")
      .send({
        courseId: "",
        challengeId: null,
      })
      .set("Authorization", authorizationHeader)
      .expect(400)
      .then((error) => {
        expect(error.body.message).toBe("Failed to perform operation.");
      });

    await request(`${ENV.HOST}/user/active-challenge-ids`)
      .post("/")
      .send({
        courseId: "blegh",
        challengeId: "sa7sa7f7f",
      })
      .set("Authorization", authorizationHeader)
      .expect(400)
      .then((error) => {
        expect(error.body.message).toBe("Failed to perform operation.");
      });

    await request(`${ENV.HOST}/user/active-challenge-ids`)
      .post("/")
      .send({
        courseId: "fpvPtfu7s",
        challengeId: "Vii7hQ1xd",
      })
      .set("Authorization", authorizationHeader)
      .expect(400)
      .then((error) => {
        expect(error.body.message).toBe("Failed to perform operation.");
      });

    request(`${ENV.HOST}/user/active-challenge-ids`)
      .post("/")
      .send({
        courseId: "fpvPtfu7s",
        challengeId: "blargh",
      })
      .set("Authorization", authorizationHeader)
      .expect(400)
      .end((error, response) => {
        expect(response.body.message).toBe("Failed to perform operation.");
        done(error);
      });
  });

  test.skip("/active-challenge-ids (POST) updates last active challenge ids correctly", async (done) => {
    const accessToken = await fetchAccessToken();
    const authorizationHeader = `Bearer ${accessToken}`;

    /**
     * Helper to fetch progress history for a challenge id.
     */
    const updateChallengeIds = async (
      courseId: string,
      challengeId: string,
    ) => {
      const body = {
        courseId,
        challengeId,
      };
      const result = await axios.post(
        `${ENV.HOST}/user/active-challenge-ids`,
        body,
        { headers: { Authorization: authorizationHeader } },
      );
      return result.data;
    };

    const checkChallengeIds = async (expected: LastActiveChallengeIds) => {
      const user = await fetchUserWithAccessToken(accessToken);
      expect(user.lastActiveChallengeIds).toEqual(expected);
    };

    // Check initial state is {}
    await checkChallengeIds({});

    const TS = "fpvPtfu7s";
    const RUST = "alosiqu45";

    // Update a challenge
    await updateChallengeIds(TS, "TL9i1z2rT");

    // Check the state updated
    await checkChallengeIds({
      [TS]: "TL9i1z2rT",
      lastActiveChallenge: "TL9i1z2rT",
    });

    await updateChallengeIds(TS, "sfxItMSR");
    await updateChallengeIds(TS, "Fpw0qzGv");
    await updateChallengeIds(TS, "4rq4ezCu");

    // Check the state updated
    await checkChallengeIds({
      [TS]: "4rq4ezCu",
      lastActiveChallenge: "4rq4ezCu",
    });

    // Update challenge in a different course
    await updateChallengeIds(RUST, "S@Ghw6X75");

    // Check the state updated and added the new course
    await checkChallengeIds({
      [TS]: "4rq4ezCu",
      [RUST]: "S@Ghw6X75",
      lastActiveChallenge: "S@Ghw6X75",
    });

    // Update both course challenges again
    await updateChallengeIds(TS, "HB0P9thnMf");
    await updateChallengeIds(RUST, "Qug@7dDI$");

    // Check the state updated and added the new course
    await checkChallengeIds({
      [TS]: "HB0P9thnMf",
      [RUST]: "Qug@7dDI$",
      lastActiveChallenge: "Qug@7dDI$",
    });

    done();
  });
});
