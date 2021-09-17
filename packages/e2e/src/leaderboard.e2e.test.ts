import {
  createAuthenticatedUser,
  fetchLeaderboardRankings,
} from "./utils/e2e-utils";

describe("Leaderboard feature displays user rankings", () => {
  test("/user/leaderboard API returns user rankings", async () => {
    let result = await createAuthenticatedUser("github");
    let token = result.accessToken;

    const response = await fetchLeaderboardRankings(token);
    const rankings = response.data;

    expect(Array.isArray(rankings)).toBe(true);
    for (const ranking of rankings) {
      expect(typeof ranking.isUser).toBe("boolean");
      expect(typeof ranking.completedChallenges).toBe("number");
    }
  });
});
