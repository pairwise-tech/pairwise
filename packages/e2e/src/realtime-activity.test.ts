import {
  wait,
  createAuthenticatedUser,
  fetchRecentProgressUpdates,
  updateProgressForChallenge,
} from "./utils/e2e-utils";

/**
 * Test the recent progress updates feature which tracks updates
 * using Redis. This test suite is run first to avoid interference
 * from the other test suits which also hit the /progress API.
 */
describe("Recent progress records track updates correctly", () => {
  test("/progress/recent API returns recently updated challenges", async () => {
    let result = await createAuthenticatedUser("github");
    let token = result.accessToken;

    const courseId = "fpvPtfu7s";

    const challengeIdsOne = [
      "2o@y8Hx6oD",
      "qIaveTrGu",
      "@kclY2ckQ",
      "Jn4aBfdYt",
      "TFgdPCNyW",
      "u374HXzhc",
      "TC7HwcXRc",
      "A12jr6EIC",
      "9H3df@@nF",
      "crFGCiQkX",
      "8h2qN7py$",
      "jso8aTAKQ",
      "hx0KMlQN2",
    ];

    for (const id of challengeIdsOne) {
      await updateProgressForChallenge(token, id, courseId);
    }

    // Need to wait briefly for the Redis updates to take place
    await wait(100);

    let response = await fetchRecentProgressUpdates(token);

    expect(response.data.totalUsersCount).toBe(1);
    expect(response.data.completedChallengesCount).toBe(challengeIdsOne.length);

    result = await createAuthenticatedUser("github");
    token = result.accessToken;

    const challengeIdsTwo = [
      "KbkT6v8g",
      "UNWwhyHW",
      "JALDb575",
      "LyQWstvV",
      "bhxwOAx9",
      "VppIs2a9",
      "g2CWrS2M",
      "fvvYrahy",
      "H0MjLq1p",
      "_gO2lskh",
      "fuZBwqNC",
    ];

    for (const id of challengeIdsTwo) {
      await updateProgressForChallenge(token, id, courseId);
    }

    // Need to wait briefly for the Redis updates to take place
    await wait(50);

    response = await fetchRecentProgressUpdates(token);

    expect(response.data.totalUsersCount).toBe(2);
    expect(response.data.completedChallengesCount).toBe(
      challengeIdsOne.length + challengeIdsTwo.length,
    );
  });
});
