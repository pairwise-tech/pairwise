import axios from "axios";
import request from "supertest";
import { ChallengeMeta, IProgressDto } from "../../common/dist/main";
import { fetchAccessToken, HOST } from "./utils/e2e-utils";

/** ===========================================================================
 * e2e Tests for /challenge-meta APIs
 * ============================================================================
 */

describe.only("Challenge Meta APIs", () => {
  let accessToken;
  let authorizationHeader;

  beforeAll(async () => {
    accessToken = await fetchAccessToken();
    authorizationHeader = `Bearer ${accessToken}`;
  });

  test("/challenge-meta (GET) requires a valid challengeId", () => {
    return request(`${HOST}/challenge-meta/asd97f8809as7fsa`)
      .get("/")
      .set("Authorization", authorizationHeader)
      .expect(400);
  });

  test("Challenge Meta tracks challenge completed counts correctly", async (done) => {
    const getCurrentMeta = async (challengeId: string) => {
      return axios.get<ChallengeMeta>(`${HOST}/challenge-meta/${challengeId}`, {
        headers: { Authorization: authorizationHeader },
      });
    };

    let meta = await getCurrentMeta("5ziJI35f");

    const updateProgressItem = async (progress: IProgressDto) => {
      return axios.post(`${HOST}/progress`, progress, {
        headers: { Authorization: authorizationHeader },
      });
    };

    const challengeOneTime = new Date();
    await updateProgressItem({
      complete: false,
      challengeId: "5ziJI35f",
      courseId: "fpvPtfu7s",
      timeCompleted: challengeOneTime,
    });

    // numberOfTimesCompleted should not be updated yet
    let expected = meta.data.numberOfTimesCompleted;
    meta = await getCurrentMeta("5ziJI35f");
    expect(meta.data.numberOfTimesCompleted).toBe(expected);

    // Complete the challenge
    await updateProgressItem({
      complete: true,
      challengeId: "5ziJI35f",
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
      challengeId: "5ziJI35f",
      courseId: "fpvPtfu7s",
      timeCompleted: new Date(),
    });

    // Update meta count
    expected = meta.data.numberOfTimesCompleted + 1;
    meta = await getCurrentMeta("5ziJI35f");
    expect(meta.data.numberOfTimesCompleted).toBe(expected);

    // Create new user
    accessToken = await fetchAccessToken();
    authorizationHeader = `Bearer ${accessToken}`;

    // Complete the same challenge again
    await updateProgressItem({
      complete: true,
      challengeId: "5ziJI35f",
      courseId: "fpvPtfu7s",
      timeCompleted: new Date(),
    });

    // Check that the numberOfTimesCompleted has updated again
    request(`${HOST}/challenge-meta/5ziJI35f`)
      .get("/")
      .set("Authorization", authorizationHeader)
      .expect(200)
      .end((error, response) => {
        expected = meta.data.numberOfTimesCompleted + 1;
        expect(response.body.numberOfTimesCompleted).toBe(expected);
        done(error);
      });
  });
});
