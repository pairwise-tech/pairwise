import axios from "axios";
import request from "supertest";
import { ChallengeMeta, IProgressDto } from "../../common/dist/main";
import ENV from "./utils/e2e-env";
import { fetchAccessToken } from "./utils/e2e-utils";

/** ===========================================================================
 * e2e Tests for /challenge-meta APIs
 * ============================================================================
 */

describe("Challenge Meta APIs", () => {
  let accessToken;
  let authorizationHeader;

  beforeAll(async () => {
    accessToken = await fetchAccessToken();
    authorizationHeader = `Bearer ${accessToken}`;
  });

  test("/challenge-meta (GET) requires a valid challengeId", () => {
    return request(`${ENV.HOST}/challenge-meta/asd97f8809as7fsa`)
      .get("/")
      .set("Authorization", authorizationHeader)
      .expect(400);
  });

  test("Challenge Meta tracks challenge completed counts correctly", async (done) => {
    const getCurrentMetaChallengeCount = async (challengeId: string) => {
      const config = { headers: { Authorization: authorizationHeader } };
      const result = await axios.get<ChallengeMeta>(
        `${ENV.HOST}/challenge-meta/${challengeId}`,
        config,
      );

      return result.data.numberOfTimesCompleted;
    };

    /**
     * NOTE: If any other e2e tests updated this same challenge id,
     * they would conflict with this test and possibly produce spurious
     * results.
     */
    let count = await getCurrentMetaChallengeCount("hU@oatYsK");

    const updateProgressItem = async (progress: IProgressDto) => {
      return axios.post(`${ENV.HOST}/progress`, progress, {
        headers: { Authorization: authorizationHeader },
      });
    };

    const challengeOneTime = new Date();
    await updateProgressItem({
      complete: false,
      challengeId: "hU@oatYsK",
      courseId: "fpvPtfu7s",
      timeCompleted: challengeOneTime,
    });

    // numberOfTimesCompleted should not be updated yet
    let expected = count;
    count = await getCurrentMetaChallengeCount("hU@oatYsK");
    expect(count).toBe(expected);

    // Complete the challenge
    await updateProgressItem({
      complete: true,
      challengeId: "hU@oatYsK",
      courseId: "fpvPtfu7s",
      timeCompleted: new Date(),
    });

    // Update some other challenge
    await updateProgressItem({
      complete: true,
      challengeId: "ny51KoEI",
      courseId: "fpvPtfu7s",
      timeCompleted: new Date(),
    });

    // Complete the challenge again with the same user
    await updateProgressItem({
      complete: true,
      challengeId: "hU@oatYsK",
      courseId: "fpvPtfu7s",
      timeCompleted: new Date(),
    });

    // Update meta count
    expected = count + 1;
    count = await getCurrentMetaChallengeCount("hU@oatYsK");
    expect(count).toBe(expected);

    // Create new user
    accessToken = await fetchAccessToken();
    authorizationHeader = `Bearer ${accessToken}`;

    // Complete the same challenge again
    await updateProgressItem({
      complete: true,
      challengeId: "hU@oatYsK",
      courseId: "fpvPtfu7s",
      timeCompleted: new Date(),
    });

    // Check that the numberOfTimesCompleted has updated again
    request(`${ENV.HOST}/challenge-meta/hU@oatYsK`)
      .get("/")
      .set("Authorization", authorizationHeader)
      .expect(200)
      .end((error, response) => {
        expected = count + 1;
        expect(response.body.numberOfTimesCompleted).toBe(expected);
        done(error);
      });
  });
});
